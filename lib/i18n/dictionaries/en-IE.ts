/**
 * English (Ireland) Dictionary
 */

export const enIE = {
  // Navigation
  nav: {
    logo: "Engage7",
    getStarted: "Run Analysis",
  },

  // Homepage - Hero Section
  home: {
    hero: {
      title: "Understand your wearable data.",
      titleHighlight: "Clearly.",
      subtitle:
        "Engage7 transforms raw health signals into deterministic insights built from your physiological baseline.",
      ctaPrimary: "Run Analysis",
      ctaSecondary: "How It Works",
      trustBadge: "Deterministic insights from your data",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "Three pillars of clarity",
      sectionSubtitle: "Built to deliver explainable insights you can trust.",

      deterministic: {
        title: "Deterministic Analysis",
        description:
          "No black-box predictions. Insights derived from measurable physiological baselines.",
      },

      explainable: {
        title: "Explainable Signals",
        description:
          "Understand trends in sleep, heart rate, activity, and recovery through transparent analysis.",
      },

      privacy: {
        title: "Privacy by Design",
        description:
          "Your dataset remains yours. Engage7 processes signals without training external AI models on your data.",
      },
    },

    // Final CTA Section
    cta: {
      title: "Ready to understand your data?",
      subtitle:
        "Upload your dataset, run a deterministic analysis, and review a clear result you can trust.",
      ctaPrimary: "Run Analysis",
      ctaSecondary: "Learn How It Works",
    },

    // Footer
    footer: {
      copyright: "© 2026 Engage7 Labs. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
    },
  },

  // Analyze Page
  analyze: {
    title: "Run your Engage7 analysis",
    subtitle:
      "Upload your wearable dataset to generate a deterministic, explainable insight brief based on your physiological baseline.",

    workflow: {
      title: "How it works",
      step1: {
        title: "Upload Dataset",
        description: "Provide your Apple Health export",
      },
      step2: {
        title: "Processing",
        description: "Deterministic analysis runs on your data",
      },
      step3: {
        title: "Results",
        description: "Review explainable insights and trends",
      },
    },

    upload: {
      title: "Upload your dataset",
      description: "Supported format: Apple Health export (export.zip)",
      dragHint: "Drag and drop your file here, or click to browse",
      fileSelected: "File selected:",
      analyzing: "Analyzing...",
      buttonUpload: "Upload and Analyze",
      buttonUploading: "Uploading...",
      buttonProcessing: "Processing...",
    },

    privacy: {
      title: "Your data stays yours",
      point1: "Your file is used only for analysis",
      point2: "No training on external AI models",
      point3: "Processing follows deterministic rules",
      point4: "Results generated from your physiological baseline",
    },

    backToHome: "Back to Home",
  },

  // Result Page
  result: {
    title: "Analysis Result",
    loading: "Loading your results...",

    status: {
      pending: "Processing",
      processing: "Analyzing your data",
      completed: "Analysis Complete",
      failed: "Analysis Failed",
    },

    summary: {
      title: "Executive Summary",
      datasetPeriod: "Dataset Period",
      recordsAnalyzed: "Records Analyzed",
      insightsGenerated: "Insights Generated",
    },

    insights: {
      title: "Key Insights",
      noInsights: "No insights available",
    },

    artifacts: {
      title: "Report & Artifacts",
      downloadPDF: "Download PDF Report",
      downloadData: "Download Processed Data",
    },

    error: {
      title: "Analysis Error",
      description:
        "An error occurred during analysis. Please try again or contact support.",
      retryButton: "Try Again",
    },

    backToAnalyze: "Run Another Analysis",
    backToHome: "Back to Home",
  },

  // Common
  common: {
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    cancel: "Cancel",
    close: "Close",
    next: "Next",
    previous: "Previous",
    viewDetails: "View Details",
  },
};

export type Dictionary = typeof enIE;
