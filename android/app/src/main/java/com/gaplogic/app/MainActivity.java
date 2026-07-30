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

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "GapLogicMainActivity";
    
    // Configurable URLs
    // 10.0.2.2 is the special IP address that points to the host machine's loopback from the Android emulator.
    // In production, change this to the deployed web application URL (e.g. https://gaplogic.vercel.app)
    private static final String DEV_URL = "http://localhost:9002";
    
    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private Button btnRetry;
    private boolean isError = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Install the splash screen before calling super.onCreate()
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

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
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (connectivityManager != null) {
                NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.getActiveNetwork());
                if (capabilities != null) {
                    return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                           capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                           capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET);
                }
            }
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException checking network availability: " + e.getMessage());
        }
        return false;
    }
}
