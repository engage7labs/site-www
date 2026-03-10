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
      trustLine1: "No account required",
      trustLine2: "Your data stays yours",
      trustLine3: "Analysis ~1 minute",
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

    // How Engage7 Works Section
    howItWorks: {
      sectionTitle: "How Engage7 works",
      sectionSubtitle:
        "Four steps from raw data to clear, explainable insights",

      step1: {
        title: "Upload dataset",
        description: "Provide your Apple Health export as a standard .zip file",
      },

      step2: {
        title: "Detect physiological baseline",
        description:
          "Engage7 analyzes your individual patterns to establish your normal ranges",
      },

      step3: {
        title: "Apply deterministic rules",
        description:
          "Transparent processing rules identify meaningful signals and trends",
      },

      step4: {
        title: "Generate insight brief",
        description:
          "Receive a clear, actionable report with explainable findings",
      },
    },

    // Example Report Section
    exampleReport: {
      sectionTitle: "What to expect",
      sectionSubtitle:
        "See what kind of insights you'll receive from your analysis",
      cardTitle: "Sample Analysis Report",
      cardSubtitle: "Example output structure",

      sampleSummary: {
        title: "Executive Summary",
        description:
          "High-level overview of key findings and patterns detected in your dataset",
      },

      sampleBaseline: {
        title: "Baseline Window",
        description:
          "Your individual physiological normal ranges for heart rate, HRV, and recovery",
      },

      sampleSignals: {
        title: "Key Signals",
        description:
          "Significant patterns, anomalies, or trends identified across sleep, activity, and recovery",
      },

      sampleStatus: {
        title: "Overall Pattern",
        description:
          "Context-aware assessment of your recent physiological state",
      },

      viewSampleCTA: "View sample report",
      learnMoreCTA: "Learn more about our methodology",
    },

    // FAQ Section
    faq: {
      sectionTitle: "Frequently Asked Questions",

      q1: {
        question: "What data can I upload?",
        answer:
          "Currently, Engage7 supports Apple Health exports. Export your data as a .zip file from the Health app on your iPhone and upload it here.",
      },

      q2: {
        question: "What kind of insights will I receive?",
        answer:
          "You'll receive a deterministic analysis report covering sleep patterns, heart rate variability, activity trends, and recovery signals. All insights are explainable and derived from your physiological baseline.",
      },

      q3: {
        question: "Is my data used to train AI models?",
        answer:
          "No. Your dataset is processed using deterministic rules to generate your personal analysis. We do not train external AI models on your data.",
      },

      q4: {
        question: "Is this medical advice?",
        answer:
          "No. Engage7 provides informational insights only. Results do not constitute medical advice and should not replace consultation with qualified healthcare professionals.",
      },

      q5: {
        question: "How long does analysis take?",
        answer:
          "Most analyses complete in 30–90 seconds, depending on the size of your dataset.",
      },

      q6: {
        question: "What happens to my data after analysis?",
        answer:
          "Your uploaded file and analysis results are temporarily stored to generate your report. You retain full ownership of your data and can request deletion at any time.",
      },
    },

    // Technology Stack
    techStack: {
      title: "Built with trusted technologies",
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
      research: "Research",
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
      formatHint: "Supported format: Apple Health export (.zip)",
      expectationHint: "Analysis typically completes in 30–90 seconds.",
    },

    consent: {
      title: "Consent for dataset processing",
      description:
        "I confirm that this dataset belongs to me and I consent to Engage7 processing it for the purpose of generating a deterministic analysis report.",
      disclaimer:
        "I understand that the results are informational and do not constitute medical advice.",
      linkText: "Read our Privacy Policy",
      required: "You must consent to continue",
    },

    trust: {
      title: "Your data stays yours",
      point1: "File used only for this analysis",
      point2: "No training of external AI models",
      point3: "Deterministic processing rules",
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

  // Privacy Policy
  privacyPolicy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 8, 2026",
    intro:
      "Engage7 is committed to protecting your privacy. This policy explains how we handle your data when you use our analysis service.",
    sections: {
      dataCollection: {
        title: "Data Collection",
        content:
          "When you upload a dataset for analysis, we process the file to generate deterministic insights. You retain ownership of your data.",
      },
      dataUsage: {
        title: "Data Usage",
        content:
          "Your dataset is used solely to generate your analysis report. We do not train external AI models on your data. Processing follows deterministic rules based on physiological baselines.",
      },
      dataStorage: {
        title: "Data Storage",
        content:
          "Analysis results and uploaded files are temporarily stored to generate your report. We do not sell or share your data with third parties.",
      },
      dataRights: {
        title: "Your Rights",
        content:
          "You retain full ownership of your data. You can request deletion of your analysis results at any time by contacting us.",
      },
    },
    backToHome: "Back to Home",
  },

  // Terms of Service
  termsOfService: {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 8, 2026",
    intro:
      "By using Engage7, you agree to these terms. Please read them carefully.",
    sections: {
      serviceDescription: {
        title: "Service Description",
        content:
          "Engage7 provides deterministic analysis of wearable health data. The service generates informational insights based on your physiological baseline.",
      },
      userResponsibilities: {
        title: "User Responsibilities",
        content:
          "You are responsible for ensuring that you have the right to upload any dataset you submit. You must own the data or have permission to process it.",
      },
      disclaimer: {
        title: "Medical Disclaimer",
        content:
          "Engage7 results are informational and do not constitute medical advice. Always consult qualified healthcare professionals for medical decisions.",
      },
      serviceChanges: {
        title: "Service Changes",
        content:
          "Engage7 may evolve over time. We reserve the right to modify or discontinue features as the service develops.",
      },
      limitation: {
        title: "Limitation of Liability",
        content:
          "Engage7 is provided as-is. We make no guarantees about the accuracy or completeness of analysis results.",
      },
    },
    backToHome: "Back to Home",
  },

  // Contact Page
  contact: {
    title: "Contact Us",
    subtitle: "Have questions? We'd love to hear from you.",
    linkedin: {
      heading: "Connect on LinkedIn",
      description:
        "Reach out to Rodrigo Marques on LinkedIn for questions, feedback, or collaboration opportunities.",
      button: "Open LinkedIn Profile",
    },
    backToHome: "Back to Home",
  },

  // Friends Page
  friends: {
    title: "Invite Friends",
    subtitle:
      "Share Engage7 with friends and help them understand their wearable data too.",
    shareTitle: "Share Engage7",
    shareDescription: "Choose a platform to share Engage7 with your network.",
    shareText:
      "I just analyzed my wearable data with Engage7 — deterministic insights from my physiological baseline. Try it yourself!",
    shareUrl: "https://engage7.com",
    copyLink: "Copy Link",
    copied: "Copied!",
    backToHome: "Back to Home",

    socialProof: {
      title: "Community Activity",
      totalUploads: "Total Analyses",
      recentUploads: "Analyses (24h)",
      languages: "Languages",
      loading: "Loading metrics...",
      error: "Metrics unavailable",
    },
  },

  // Social Share
  socialShare: {
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    x: "X",
    instagram: "Instagram",
    copyLink: "Copy Link",
    copied: "Copied!",
  },
};

export type Dictionary = typeof enIE;
