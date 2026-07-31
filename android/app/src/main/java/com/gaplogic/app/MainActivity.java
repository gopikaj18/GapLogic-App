package com.gaplogic.app;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.splashscreen.SplashScreen;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "GapLogicMainActivity";
    
    // DEV_URL points to the local HTTP server running natively inside the phone app
    private static final String DEV_URL = "http://10.0.2.2:9002";
    
    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private Button btnRetry;
    private boolean isError = false;
    
    private ServerSocket serverSocket;
    private boolean isServerRunning = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the splash screen before calling super.onCreate()
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Start the local offline web server
        startLocalServer();

        // Bind views
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        btnRetry = findViewById(R.id.btnRetry);

        // Configure WebView
        setupWebView();

        // Handle back navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        // Set up retry button click listener
        btnRetry.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadAppUrl();
            }
        });

        // Load the web app URL
        loadAppUrl();

        // Handle deep link if launched via intent
        handleDeepLink(getIntent());
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        isServerRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
                Log.i(TAG, "Local offline server socket closed.");
            } catch (Exception e) {
                Log.e(TAG, "Failed to close server socket gracefully", e);
            }
        }
    }

    private void startLocalServer() {
        isServerRunning = true;
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    serverSocket = new ServerSocket(9002, 0, InetAddress.getByName("127.0.0.1"));
                    Log.i(TAG, "Local offline server socket successfully running at http://127.0.0.1:9002");
                    while (isServerRunning) {
                        final Socket socket = serverSocket.accept();
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                handleClientRequest(socket);
                            }
                        }).start();
                    }
                } catch (Exception e) {
                    if (isServerRunning) {
                        Log.e(TAG, "Local server socket execution encountered an error", e);
                    }
                }
            }
        }).start();
    }

    private void handleClientRequest(Socket socket) {
        try {
            InputStream is = socket.getInputStream();
            OutputStream os = socket.getOutputStream();
            
            // Parse HTTP Request Line (first line)
            java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is));
            String requestLine = reader.readLine();
            if (requestLine == null) {
                socket.close();
                return;
            }
            
            String[] tokens = requestLine.split(" ");
            if (tokens.length < 2) {
                socket.close();
                return;
            }
            
            String path = tokens[1];
            // Remove query string if present
            int queryIndex = path.indexOf('?');
            if (queryIndex > -1) {
                path = path.substring(0, queryIndex);
            }
            
            // Map default route to index.html
            if (path.equals("/")) {
                path = "/index.html";
            }
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            
            InputStream fileStream = null;
            String mime = "text/html";
            try {
                fileStream = getAssets().open("www/" + path);
                if (path.endsWith(".js")) mime = "application/javascript";
                else if (path.endsWith(".css")) mime = "text/css";
                else if (path.endsWith(".png")) mime = "image/png";
                else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) mime = "image/jpeg";
                else if (path.endsWith(".svg")) mime = "image/svg+xml";
                else if (path.endsWith(".json")) mime = "application/json";
            } catch (IOException e) {
                // Fallback to index.html to support React/Next Router client-side routing
                try {
                    fileStream = getAssets().open("www/index.html");
                    mime = "text/html";
                } catch (IOException ex) {
                    String response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                    os.write(response.getBytes());
                    os.flush();
                    socket.close();
                    return;
                }
            }
            
            int length = fileStream.available();
            String header = "HTTP/1.1 200 OK\r\nContent-Type: " + mime + "\r\nContent-Length: " + length + "\r\nConnection: close\r\n\r\n";
            os.write(header.getBytes());
            
            byte[] buffer = new byte[8192];
            int read;
            while ((read = fileStream.read(buffer)) != -1) {
                os.write(buffer, 0, read);
            }
            
            fileStream.close();
            os.flush();
            socket.close();
        } catch (Exception e) {
            Log.e(TAG, "Error processing client request", e);
            try { socket.close(); } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data != null && "gaplogic".equals(data.getScheme())) {
            String token = data.getQueryParameter("token");
            if (token != null && !token.isEmpty()) {
                Log.d(TAG, "Deep Link Token received: " + token);
                // Inject the token into localStorage and reload/redirect to dashboard
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                            "localStorage.setItem('gaplogic_token', '" + token + "'); window.location.href = '/';",
                            null
                        );
                    }
                });
            }
        }
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        
        // Allow mixed content for local HTTP/HTTPS development
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Use a clean mobile Chrome user agent to bypass Google OAuth WebView blocks.
        // We keep the "GapLogicAndroid" token at the end so the web app can still detect the wrapper.
        String customUserAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 GapLogicAndroid";
        settings.setUserAgentString(customUserAgent);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                isError = false;
                progressBar.setVisibility(View.VISIBLE);
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                if (isError) {
                    webView.setVisibility(View.GONE);
                    errorLayout.setVisibility(View.VISIBLE);
                } else {
                    webView.setVisibility(View.VISIBLE);
                    errorLayout.setVisibility(View.GONE);
                }
            }

            // Deprecated callback for older API levels (< 23)
            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                isError = true;
                Log.e(TAG, "WebView load error: " + description + " (Code: " + errorCode + ") for URL: " + failingUrl);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // Only show error for the main page load failure
                if (request.isForMainFrame()) {
                    isError = true;
                    Log.e(TAG, "WebView main frame load error: " + error.getDescription() + " (Code: " + error.getErrorCode() + ")");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                
                // Detect requests that should open in the system browser
                if (url.contains("open_external=true") || url.startsWith("gaplogic-open-browser://")) {
                    String realUrl = url;
                    if (url.startsWith("gaplogic-open-browser://")) {
                        realUrl = url.substring("gaplogic-open-browser://".length());
                        // Fix colon stripping by Android WebView URL parser
                        if (realUrl.startsWith("http//")) {
                            realUrl = "http://" + realUrl.substring(6);
                        } else if (realUrl.startsWith("https//")) {
                            realUrl = "https://" + realUrl.substring(7);
                        }
                    }
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(realUrl));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to launch external browser for URL: " + realUrl, e);
                        return false;
                    }
                }
                
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false; // let WebView handle it
                }
                
                // For non-http protocols (e.g. mailto, tel, market, etc.), try opening external apps
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    Log.w(TAG, "Failed to launch intent for URL: " + url, e);
                    return false;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    if (!isError) {
                        progressBar.setVisibility(View.VISIBLE);
                    }
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("WebViewConsole", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }
        });
    }

    private void loadAppUrl() {
        if (!isNetworkAvailable()) {
            isError = true;
            webView.setVisibility(View.GONE);
            errorLayout.setVisibility(View.VISIBLE);
            return;
        }

        isError = false;
        errorLayout.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        
        // Load target URL
        webView.loadUrl(DEV_URL);
    }

    private boolean isNetworkAvailable() {
        return true; // Local server doesn't require an active external network
    }
}
