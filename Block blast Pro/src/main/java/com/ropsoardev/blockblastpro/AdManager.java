package com.ropsoardev.blockblastpro;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.view.ViewGroup;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

/**
 * Google AdMob Native Monetization Manager for Block Blast Pro.
 * Handles Banner Ads, Interstitials (Game Over), and Rewarded Videos (Revive / Extra Hints).
 */
public class AdManager {

    private static final String TAG = "BlockBlastAdManager";

    // Google AdMob Production Ad Unit IDs
    private static final String TEST_BANNER_ID       = "ca-app-pub-8347952847217732/4265596953";
    private static final String TEST_INTERSTITIAL_ID = "ca-app-pub-8347952847217732/6532667641";
    private static final String TEST_REWARDED_ID     = "ca-app-pub-8347952847217732/9317778932";

    private static AdManager instance;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private int gameOverCount = 0;
    private boolean initialized = false;

    public interface OnRewardEarnedCallback {
        void onRewardEarned();
    }

    private AdManager() {}

    public static synchronized AdManager getInstance() {
        if (instance == null) {
            instance = new AdManager();
        }
        return instance;
    }

    /**
     * Initializes Google Mobile Ads SDK.
     */
    public void init(Context context) {
        if (initialized) return;
        try {
            MobileAds.initialize(context, initializationStatus -> {
                Log.d(TAG, "Google Mobile Ads initialized successfully.");
                initialized = true;
                loadInterstitial(context);
                loadRewarded(context);
            });
        } catch (Exception e) {
            Log.e(TAG, "AdMob initialization error: " + e.getMessage());
        }
    }

    /**
     * Creates and attaches an anchored smart banner ad to the bottom of the screen.
     */
    public void attachBanner(Activity activity, ViewGroup container) {
        if (container == null) return;
        try {
            AdView adView = new AdView(activity);
            adView.setAdUnitId(TEST_BANNER_ID);
            adView.setAdSize(AdSize.BANNER);
            container.removeAllViews();
            container.addView(adView);

            AdRequest adRequest = new AdRequest.Builder().build();
            adView.loadAd(adRequest);
        } catch (Exception e) {
            Log.e(TAG, "Failed to load banner ad: " + e.getMessage());
        }
    }

    /**
     * Pre-loads an interstitial ad.
     */
    public void loadInterstitial(Context context) {
        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(context, TEST_INTERSTITIAL_ID, adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    interstitialAd = ad;
                    Log.d(TAG, "Interstitial ad loaded.");
                }

                @Override
                public void onAdFailedToLoad(LoadAdError loadAdError) {
                    interstitialAd = null;
                    Log.w(TAG, "Interstitial failed to load: " + loadAdError.getMessage());
                }
            });
    }

    /**
     * Pre-loads a rewarded video ad.
     */
    public void loadRewarded(Context context) {
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(context, TEST_REWARDED_ID, adRequest,
            new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(RewardedAd ad) {
                    rewardedAd = ad;
                    Log.d(TAG, "Rewarded ad loaded.");
                }

                @Override
                public void onAdFailedToLoad(LoadAdError loadAdError) {
                    rewardedAd = null;
                    Log.w(TAG, "Rewarded ad failed to load: " + loadAdError.getMessage());
                }
            });
    }

    /**
     * Shows an interstitial ad every 3 game overs.
     */
    public void onGameOver(Activity activity) {
        gameOverCount++;
        if (gameOverCount % 3 == 0) {
            showInterstitial(activity);
        }
    }

    /**
     * Displays the interstitial ad if ready.
     */
    public void showInterstitial(Activity activity) {
        if (interstitialAd != null) {
            interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    interstitialAd = null;
                    loadInterstitial(activity);
                }

                @Override
                public void onAdFailedToShowFullScreenContent(AdError adError) {
                    interstitialAd = null;
                    loadInterstitial(activity);
                }
            });
            interstitialAd.show(activity);
        } else {
            loadInterstitial(activity);
        }
    }

    /**
     * Shows rewarded video ad for Revive / Extra Hints.
     */
    public void showRewardedAd(Activity activity, OnRewardEarnedCallback callback) {
        if (rewardedAd != null) {
            rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override
                public void onAdDismissedFullScreenContent() {
                    rewardedAd = null;
                    loadRewarded(activity);
                }

                @Override
                public void onAdFailedToShowFullScreenContent(AdError adError) {
                    rewardedAd = null;
                    loadRewarded(activity);
                }
            });

            rewardedAd.show(activity, rewardItem -> {
                Log.d(TAG, "User earned reward: " + rewardItem.getType() + " (" + rewardItem.getAmount() + ")");
                if (callback != null) {
                    callback.onRewardEarned();
                }
            });
        } else {
            // Fallback if ad is still loading
            Log.w(TAG, "Rewarded ad not ready yet, granting reward in debug mode.");
            loadRewarded(activity);
            if (callback != null) {
                callback.onRewardEarned();
            }
        }
    }
}
