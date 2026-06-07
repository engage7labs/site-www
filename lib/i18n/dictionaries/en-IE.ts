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
      title: "See what patterns in your life",
      titleHighlight: "are showing up in your body.",
      subtitle:
        "Engage7 turns your wearable data into clear insights about sleep, recovery, and movement—based on your own patterns.",
      ctaPrimary: "Run Analysis",
      ctaSecondary: "How It Works",
      trustBadge: "Clear insights from your data",
      trustLine1: "No account required",
      trustLine2: "Your data stays yours",
      trustLine3: "Results in ~1 minute",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "Built for understanding",
      sectionSubtitle: "Clear insights you can trust and actually understand.",

      deterministic: {
        title: "Based on Your Patterns",
        description:
          "We analyze your data and identify what is actually happening. Every insight is based on your own patterns, not predictions.",
      },

      explainable: {
        title: "Easy to Understand",
        description:
          "See what's happening with your sleep, recovery, and movement. Clear language, no jargon.",
      },

      privacy: {
        title: "Your Data Stays Yours",
        description:
          "We analyze your data to give you insights, but we don't train AI models on it or share it with anyone.",
      },
    },

    // How Engage7 Works Section
    howItWorks: {
      sectionTitle: "How it works",
      sectionSubtitle:
        "Four simple steps from your wearable data to clear insights",

      step1: {
        title: "Upload your data",
        description: "Export from Apple Health and upload as a .zip file",
      },

      step2: {
        title: "We find your baseline",
        description:
          "We look at what's normal for you—not what's normal for everyone else",
      },

      step3: {
        title: "We spot the patterns",
        description:
          "We identify what's changed, what's consistent, and what stands out",
      },

      step4: {
        title: "You get clear insights",
        description:
          "See what your body is telling you, in plain language you can understand",
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
          "Your recent personal pattern across recovery, sleep, and activity signals",
      },

      sampleSignals: {
        title: "Key Signals",
        description:
          "Significant patterns, anomalies, or trends identified across sleep, activity, and recovery",
      },

      sampleStatus: {
        title: "Overall Pattern",
        description:
          "Context-aware assessment of your recent active-life readiness pattern",
      },

      viewSampleCTA: "View sample report",
      learnMoreCTA: "Learn more about our methodology",
    },

    productPreview: {
      title: "See the kind of insight you'll receive",
      subtitle:
        "Preview how Engage7 turns your Apple Health export into daily guidance, health trends, and personal patterns.",
      labels: {
        dailyGuidance: "Daily guidance",
        compareImprove: "Compare & Improve",
        healthOverview: "Health overview",
        sleepTrends: "Sleep trends",
        recoveryTrends: "Recovery trends",
        activityTrends: "Activity trends",
      },
      controls: {
        previous: "Previous preview",
        next: "Next preview",
        close: "Close preview",
        open: "Open preview",
      },
    },

    // FAQ Section
    faq: {
      sectionTitle: "Common questions",

      q1: {
        question: "What data can I upload?",
        answer:
          "Right now, we support Apple Health data. Just export it from your iPhone's Health app as a .zip file and upload it here.",
      },

      q2: {
        question: "What will I learn?",
        answer:
          "You'll see patterns in your sleep, heart rate, movement, and recovery—all based on what's normal for you, not general averages.",
      },

      q3: {
        question: "Do you use my data to train AI?",
        answer:
          "No. We analyze your data to give you insights, but we don't use it to train AI models or improve our algorithms.",
      },

      q4: {
        question: "Is this medical advice?",
        answer:
          "No. Engage7 helps you understand patterns in your data, but it's not a substitute for talking to a doctor.",
      },

      q5: {
        question: "How long does it take?",
        answer:
          "Most analyses finish in 30–90 seconds, depending on how much data you have.",
      },

      q6: {
        question: "What happens to my data after?",
        answer:
          "We keep your data temporarily to generate your report, then delete it. You always own your data.",
      },
    },

    // Technology Stack
    techStack: {
      title: "Built with trusted technologies",
    },

    // Community Activity
    communityActivity: {
      title: "Community Activity",
      totalUploads: "Total Analyses",
      recentUploads: "Analyses (24h)",
      languages: "Languages",
      loading: "Loading metrics...",
      error: "Metrics unavailable",
    },

    // Final CTA Section
    cta: {
      title: "Ready to understand your patterns?",
      subtitle:
        "Upload your data and see what your body's been trying to tell you.",
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
    title: "Analyze your wearable data",
    subtitle:
      "Export from the Health app on your iPhone, then upload the file here. We'll show you patterns in sleep, recovery, and movement based on what's normal for you.",

    workflow: {
      title: "How it works",
      step1: {
        title: "Update Data",
        description: "Refresh your Apple Health timeline",
      },
      step2: {
        title: "We Analyze",
        description: "Find patterns based on your baseline",
      },
      step3: {
        title: "You Understand",
        description: "See clear insights about your body",
      },
    },

    upload: {
      title: "Upload your Apple Health export",
      description: "Supported: Apple Health export (export.zip)",
      dragHint: "Drop your file here, or click to browse",
      fileSelected: "File ready:",
      analyzing: "Analyzing...",
      buttonUpload: "Upload & Analyze",
      buttonUploading: "Uploading...",
      buttonProcessing: "Processing...",
      formatHint: "Supported: Apple Health export (.zip)",
      expectationHint: "Usually takes 30–90 seconds.",
    },

    consent: {
      title: "Consent",
      description:
        "I confirm this data is mine and I'm OK with Engage7 analyzing it to generate insights.",
      disclaimer: "I understand this is informational and not medical advice.",
      linkText: "Read our Privacy Policy",
      required: "Please confirm to continue",
    },

    trust: {
      title: "Your data stays yours",
      point1: "Used only for your analysis",
      point2: "Not used to train AI",
      point3: "Clear, explainable results",
    },

    privacy: {
      title: "Your data stays yours",
      point1: "Only used for your analysis",
      point2: "Never used to train AI",
      point3: "Based on your own patterns",
      point4: "Clear and understandable",
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
    processingView: {
      uploadingTitle: "Uploading your data",
      uploadingBody: "Keep this tab open while we securely transfer your file.",
      uploadingFootnote: "Large Apple Health exports can take a moment.",
      analyzingTitle: "Analyzing your data",
      analyzingBody: "Typically completes in 30-90 seconds",
      delayedTitle: "Still working on your analysis...",
      delayedBody:
        "This is taking longer than expected, but we're still processing your data.",
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

    preview: {
      backToHome: "Back to Home",
      subtitle: "Your personal insight preview",
      sleepHero: {
        title: "Something interesting happened",
        titleHighlight: "in your sleep data.",
        emptyState:
          "Your sleep data has been analyzed. Explore your patterns below.",
        curiosPrompt: "See how your recovery connects to your sleep.",
        mobileCuriousPrompt: "See your recovery and activity patterns.",
        ctaRecovery: "See recovery patterns",
      },
      sections: {
        sleepPattern: "Sleep Pattern",
        recovery: "Recovery",
        activityMobility: "Activity & Mobility",
      },
      cta: {
        exploreRecovery: "Explore recovery",
        exploreActivity: "Explore activity next",
        viewMovement: "View movement details",
      },
      emptyChart: "Not enough data to visualize.",
      emptyInsights: "Not enough data to generate this insight yet.",
      insightsInEnglish: "Insights generated in English",
      dataReveals: "Your data reveals",
      basedOnAnalysis: "Based on your analysis",
      builtFromPrefix: "Built from",
      builtFromSuffix: "of your personal data",
      provenanceLabel: "Your dataset",
      comparePlans: "Compare plans",
      plans: {
        free: {
          name: "Free",
          tagline: "Get started with your data",
          singleUpload: "Single analysis upload",
          previewInsights: "Preview insights (sleep, recovery, activity)",
          basicTrend: "Basic trend visualization",
        },
        premium: {
          name: "Premium",
          tagline: "Full insight experience",
          longitudinal: "Longitudinal insights across all signals",
          baseline: "Personalized baseline comparisons",
          actionable: "Actionable improvement suggestions",
          dashboard: "Full private health dashboard",
          export: "PDF & CSV report export",
        },
        superPremium: {
          name: "Super Premium",
          tagline: "Deep analysis modules",
          everything: "Everything in Premium",
          advancedRecovery: "Advanced recovery analysis",
          circadian: "Circadian rhythm mapping",
          multiPeriod: "Multi-period trend comparison",
          comingSoon: "* Advanced modules in development",
        },
      },
      fullReport: {
        title: "Unlock your complete analysis",
        description:
          "See trends over time, correlations between your signals, and access your personal portal — free for 90 days.",
        downloadButton: "Open my Premium Free Portal",
        runAnother: "Run another analysis",
        emailWarning:
          "We couldn't send your welcome email — your portal is still open.",
      },
      protectedHandoff: {
        title: "Update your existing Portal",
        description:
          "This export appears to match a protected Engage7 timeline. Sign in to continue.",
        cta: "Sign in to update my Portal",
      },
    },

    artifacts: {
      title: "Report & Artifacts",
      downloadPDF: "Download PDF Report",
      downloadData: "Download Processed Data",
    },
    premiumModal: {
      title: "Open your Premium Free Portal",
      description: "Enter your email to unlock 90 days of Premium Free access.",
      emailLabel: "Your email",
      emailRequired: "Email is required to unlock Premium Free.",
      emailInvalid: "Please enter a valid email address.",
      consent:
        "I agree to store my processed health insights so Engage7 can show me trends and portal insights. I can delete this data at any time from portal settings.",
      success: "Your 90-day Premium Free access has started",
      genericError: "Something went wrong. Please try again.",
      opening: "Opening your Portal...",
      open: "Open your Premium Free Portal",
    },
    protectedHandoffModal: {
      title: "Sign in to update your Portal",
      body: "This export appears to match a protected Engage7 timeline. Sign in to continue updating your data.",
      button: "Sign in to update my Portal",
      blocked:
        "This export appears to match a protected Engage7 timeline. Sign in with the matching account to continue.",
      genericError: "We could not continue this protected update yet.",
    },

    error: {
      title: "Analysis Error",
      description:
        "An error occurred during analysis. Please try again or contact support.",
      retryButton: "Try Again",
      notFoundTitle: "Result Not Found",
      notFoundDescription:
        "This analysis job could not be found. It may have expired or the link is incorrect.",
      failedTitle: "We had trouble processing this file",
      failedHint:
        "This can happen with unsupported or incomplete exports. You can try again with a different file.",
      calmDefault:
        "We weren't able to complete your analysis. Please try uploading again.",
      calmTimeout:
        "Your analysis took longer than expected. Please try again — most files process in under two minutes.",
      calmInterrupted:
        "Your analysis was interrupted. This sometimes happens during high traffic. Please try again.",
      calmStalled:
        "Your analysis didn't finish processing. Please try uploading again.",
      calmMissing:
        "Some of your results weren't available after processing. Please try again.",
      calmNetwork:
        "We couldn't connect to process your data. Please check your connection and try again.",
      calmInvalid:
        "We couldn't read the data in this file. Please make sure you're uploading an Apple Health export (.zip).",
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
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    next: "Next",
    previous: "Previous",
    viewDetails: "View Details",
    yes: "Yes",
    no: "No",
    available: "Available",
    unavailable: "Unavailable",
    notAvailable: "Not available",
    unknown: "Unknown",
    updateData: "Update Data",
    signOut: "Sign out",
    readOnly: "read-only",
    tryAgain: "Try again",
    redirecting: "Redirecting...",
    status: {
      completed: "Completed",
      complete: "Complete",
      failed: "Failed",
      imported: "Imported",
      updated: "Updated",
      processing: "Processing",
      queued: "Queued",
      valid: "Valid",
      estimated: "Estimated",
      insufficient: "Insufficient",
      unavailable: "Unavailable",
      missing: "Missing",
      publicActive: "Public active",
      publicExpired: "Public expired",
      userOwned: "User-owned",
      linked: "Linked",
      protected: "Protected",
      cleanupCandidates: "Cleanup candidates",
    },
    metrics: {
      sleepDuration: "Sleep duration",
      sleepStages: "Sleep stages",
      hrv: "HRV",
      restingHeartRate: "Resting heart rate",
      heartRate: "Heart rate",
      recoveryScore: "Recovery score",
      readiness: "Readiness",
      bodyMassChange: "Body mass change",
      steps: "Steps",
      activeEnergy: "Active energy",
      distance: "Distance",
      activeMinutes: "Active minutes",
      consistency: "Consistency",
      efficiency: "Efficiency",
      baseline: "Baseline",
      personalBaseline: "Personal baseline",
    },
  },

  auth: {
    forgot: {
      checkEmailTitle: "Check your email",
      checkEmailBody:
        "If an account exists for this email, we'll send recovery instructions.",
      title: "Reset your password",
      body: "Enter your email and we'll send you a link to reset your password.",
      send: "Send reset link",
      backToLogin: "Back to login",
      deliveryFailed:
        "We couldn't send the email right now. Please try again later.",
      genericError: "Something went wrong",
      networkError: "Network error — please try again",
    },
    reset: {
      linkUnavailableTitle: "Link unavailable",
      linkUnavailableBody:
        "This link has already been used or has expired. Please request a new access link.",
      requestNewLink: "Request a new link",
      accessCodeCreated: "Access code created",
      passwordUpdated: "Password updated",
      takingToPortal: "Taking you to your Engage7 portal...",
      passwordSet: "Your password has been set. You can now sign in.",
      signIn: "Sign in",
      createAccessCode: "Create your access code",
      setPassword: "Set your password",
      welcomeBody:
        "Choose an access code so you can return to your Engage7 portal anytime.",
      resetBody: "Choose a strong password for your Engage7 account.",
      accessCodePlaceholder: "Access code (min 8 characters)",
      passwordPlaceholder: "New password (min 8 characters)",
      confirmAccessCode: "Confirm access code",
      confirmPassword: "Confirm password",
      mismatch: "Passwords do not match",
      passwordMismatch: "Codes do not match",
      submitAccessCode: "Create access code",
      submitPassword: "Set Password",
      failed: "Failed to reset password",
      networkError: "Network error — please try again",
    },
  },

  feedback: {
    helpful: "Was this helpful?",
    thanks: "Thanks for the feedback.",
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
          "Your dataset is used solely to generate your analysis report. We do not train external AI models on your data. Processing follows deterministic rules based on your recent personal pattern.",
      },
      dataStorage: {
        title: "Data Storage",
        content:
          "Analysis results and uploaded files are temporarily stored to generate your report. We do not sell or share your data with third parties.",
      },
      dataRights: {
        title: "Your Rights",
        content:
          "You retain full ownership of your data. By default, Engage7 does not retain identifiable uploaded datasets or analysis results longer than operationally necessary. If persistent storage or account history features are introduced in the future, they will require your explicit consent and will be accompanied by updated privacy terms.",
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
          "Engage7 provides deterministic analysis of wearable data. The service generates informational insights based on your personal recovery, activity, and routine patterns.",
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
      "I just analyzed my wearable data with Engage7 — deterministic insights from my personal performance and recovery patterns. Try it yourself!",
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

  // Portal
  portal: {
    loading: "Loading…",
    shell: {
      sections: {
        overview: {
          title: "Overview",
          subtitle: "Your health data at a glance",
        },
        reports: {
          title: "My Reports",
          subtitle: "Review your generated health reports",
        },
        dataLab: {
          title: "Data Lab",
          subtitle:
            "Advanced evidence, trends, and technical context from your analysis.",
        },
        insights: {
          title: "Insights",
          subtitle:
            "Patterns detected from your data — based on your own history, not averages",
        },
        settings: {
          title: "Settings",
          subtitle: "Manage your portal preferences",
        },
        upload: {
          title: "Update Data",
          subtitle: "Refresh your Apple Health timeline",
        },
        health: {
          title: "Health",
          subtitle: "Longitudinal Sleep, Recovery & Activity",
        },
        all: {
          title: "All",
          subtitle: "Sleep, Recovery, and Activity together",
        },
        sleep: {
          title: "Sleep",
          subtitle: "Sleep duration, stages, consistency, and efficiency",
        },
        recovery: {
          title: "Recovery",
          subtitle: "HRV, heart rate, readiness, and baseline comparison",
        },
        activity: {
          title: "Activity",
          subtitle: "Steps, energy, distance, and activity consistency",
        },
      },
      claimImported: "Your public analysis is now in your Portal.",
      claimAlreadyImported: "This analysis is already in your Portal.",
      claimReady: "Your analysis is ready to import.",
      claimRetryDescription:
        "We could not import it automatically. You can retry now.",
      retry: "Retry",
      imported: "Analysis imported.",
      importStillFailed:
        "Import still did not complete. Please try again later.",
      protectedClaimBlocked:
        "This analysis is linked to another protected timeline. Sign in with the correct account to continue.",
    },
    accessCode: {
      bannerPrefix: "Secure your access —",
      bannerLink: "create an access code",
      bannerSuffix: "to return from any device.",
      title: "Create your access code",
      description:
        "Choose a personal code to return to your dashboard from any device. At least 8 characters.",
      save: "Save access code",
      genericError: "Something went wrong — please try again",
      networkError: "Network error — please try again",
    },
    compareImprove: {
      title: "Compare & Improve",
      compare: "Compare",
      interpret: "Interpret",
      improve: "Improve",
      range: "range",
      labels: {
        sleep: "Sleep duration",
        hr: "Resting heart rate",
        hrv: "Heart rate variability",
        steps: "Daily steps",
      },
      details: {
        sleepGood: "Your sleep duration is within a healthy range.",
        sleepLow: "Your sleep is shorter than the typical healthy range.",
        sleepHigh: "Your sleep is longer than what most people need.",
        hrGood: "Your resting heart rate sits in a comfortable range.",
        hrLow:
          "Your resting heart rate is lower than average — often a sign of good fitness.",
        hrHigh:
          "Your resting heart rate is on the higher side. Stress, dehydration, or fitness can influence this.",
        hrvGood: "Your HRV suggests a well-balanced nervous system.",
        hrvLow:
          "Your HRV is on the lower side, which can reflect accumulated stress.",
        hrvHigh:
          "Your HRV is notably high — typically a sign of strong recovery capacity.",
        stepsGood: "Your daily activity sits in a sustainable range.",
        stepsLow: "Your step count is below the commonly recommended range.",
        stepsHigh: "You're very active — make sure recovery keeps pace.",
      },
      interpretations: {
        sleepRecoveryAligned: "Sleep and recovery are aligned",
        sleepRecoveryAlignedBody:
          "Your sleep duration supports your nervous system recovery. This is a strong positive signal.",
        sleepRecoveryPressure: "Both sleep and recovery are under pressure",
        sleepRecoveryPressureBody:
          "Shorter sleep paired with lower HRV suggests your body may benefit from more consistent rest.",
        sleepGoodRecoveryLag: "Good sleep but recovery lags behind",
        sleepGoodRecoveryLagBody:
          "You're sleeping enough, but your HRV is still low. Other factors like stress or inconsistent timing may be involved.",
        activeEfficient:
          "Active lifestyle with efficient cardiovascular response",
        activeEfficientBody:
          "Your daily movement is solid and your resting heart rate stays low — a sign of good cardiovascular fitness.",
        lowerActivityHigherHr: "Lower activity and higher resting heart rate",
        lowerActivityHigherHrBody:
          "Less daily movement tends to pair with higher resting heart rate. Small increases in activity can help.",
        variablePatterns: "Both sleep and activity patterns are variable",
        variablePatternsBody:
          "Your day-to-day routine swings more than average. Stabilizing either sleep or movement can create a positive ripple across both.",
        consistentPattern: "Consistent lifestyle pattern",
        consistentPatternBody:
          "Both your sleep and activity are steady from day to day. This consistency supports reliable energy and recovery.",
        sleepAffectsHr: "Sleep has a measurable effect on your heart rate",
        sleepAffectsHrLower:
          "In your data, more sleep tends to lower your heart rate. This connection is strong enough to track over time.",
        sleepAffectsHrHigher:
          "In your data, more sleep is associated with a slightly higher heart rate. This connection is strong enough to track over time.",
      },
      improvements: {
        earlierBedtime: "Try going to bed 20 minutes earlier this week",
        earlierBedtimeReason:
          "Your median sleep is {current}h — even a small shift toward {target}h can improve how you feel.",
        consistentBedtime: "Pick a consistent bedtime for the next 5 days",
        consistentBedtimeReason:
          "Your sleep timing varies quite a bit. A fixed bedtime, even on weekends, helps stabilize your energy.",
        lunchWalk: "Add a 10-minute walk after lunch",
        lunchWalkReason:
          "Your daily steps average around {steps}. A short walk is the easiest way to boost that.",
        recoveryBalance: "Balance high activity with deliberate recovery time",
        recoveryBalanceReason:
          "You move a lot but your resting heart rate suggests your body may need more downtime.",
        slowBreathing: "Try 5 minutes of slow breathing before bed",
        slowBreathingReason:
          "Your HRV is on the lower side. Breathwork can activate your parasympathetic system and support recovery.",
        maintainRoutine:
          "Maintain what you're doing — your recovery signals are strong",
        maintainRoutineReason:
          "Good sleep and healthy HRV suggest your current routine works well.",
        hydrationStress: "Check hydration and stress levels this week",
        hydrationStressReason:
          "A resting heart rate of {hr} bpm is on the higher side. Hydration and stress management can help.",
        keepUploading: "Keep uploading data regularly for richer insights",
        keepUploadingReason:
          "More data points allow us to spot trends and give you better, more personalized suggestions.",
      },
    },
    statusNotice: {
      noAnalysis:
        "No analysis has been created yet. Refresh your Apple Health timeline to start your Portal.",
      processing:
        "Your latest analysis is still processing. Available Portal cards will update when it finishes.",
      failed:
        "The latest analysis did not complete. Existing Portal data is still shown where available.",
      importing: "Your public analysis is being imported into your Portal.",
      darthMissing:
        "Analysis data is available, but the current guidance layer is not ready for this analysis yet.",
      timelineMissing:
        "Analysis data is available, but the longitudinal feature timeline is not available for this account yet.",
    },
    headerSubtitle: {
      timelineUpdatedThrough: "Timeline updated through {date}",
      noRecentAnalysis:
        "No recent analysis yet. Update Data to refresh your Apple Health timeline.",
      latestAnalysisAvailable: "Latest analysis is available.",
      latestAnalysisFrom: "Latest analysis available from {date}",
    },
    shareCard: {
      title: "Share Engage7",
      description: "Share the product homepage with friends — not your data.",
      button: "Share",
    },
    dataLab: {
      title: "Data Lab",
      subtitle:
        "Advanced evidence, trends, and technical context from your analysis.",
      advancedReference: "Advanced analysis for reference.",
      correlationDisclaimer: "Correlations do not imply causation.",
      loading: "Loading...",
      loadError: "Advanced trend data could not be loaded right now.",
      empty:
        "Data Lab will appear after Engage7 has enough completed analysis data.",
      unavailable:
        "This analysis has Portal data, but the advanced Data Lab outputs are not available yet. Insights and Health may still be available.",
      technicalDataAvailable: "Technical Data Available",
      technicalDataDescription:
        "Data Lab shows supporting evidence when advanced analysis outputs exist for this analysis.",
      available: "Available",
      unavailableLabel: "Unavailable",
      trendCharts: "Trend charts",
      trendChartsAvailable: "Longitudinal signal movement over time.",
      trendChartsUnavailable:
        "Advanced trend data is not available for this analysis yet.",
      baselineRanges: "Baseline ranges",
      baselineRangesTitle: "Your Baseline Ranges",
      baselineRangesDescription:
        "Your personal reference range from available historical data.",
      baselineUnavailable: "Baseline data is unavailable for this dataset.",
      correlations: "Correlations",
      signalCorrelations: "Signal Correlations",
      signalCorrelationsReference: "Signal Correlations (reference)",
      correlationsAvailable:
        "Signals that moved together in your historical data. This does not prove cause and effect.",
      correlationsUnavailable:
        "Correlation data is unavailable for this dataset.",
      volatility: "Volatility",
      volatilityAvailable:
        "How much a signal varied across the selected period.",
      volatilityUnavailable: "Volatility data is unavailable for this dataset.",
      dataPoints: "{count} data points",
      averageSleep: "Average sleep",
      averageHrv: "Average HRV",
      averageRestingHeartRate: "Average resting heart rate",
      averageDailySteps: "Average daily steps",
      hours: "hours",
      steps: "steps",
      sleepTrend: "Sleep Trend",
      recoveryTrend: "Recovery Trend",
      activityTrend: "Activity Trend",
      sleepDuration: "Sleep duration",
      restingHeartRate: "Resting heart rate",
      dailySteps: "Daily steps",
      activeMinutes: "Active minutes",
      weeklySleepPatterns: "Weekly Sleep Patterns",
      weeklySleepPatternsDescription: "Average sleep by day of week",
      whatChangedMost: "What Changed Most",
      trendNarrative: {
        rising:
          "Your {signal} has been trending upward, currently around {latest} {unit} (average: {mean} {unit}).",
        falling:
          "Your {signal} has been trending downward, currently around {latest} {unit} (average: {mean} {unit}).",
        stable:
          "Your {signal} has been stable around {mean} {unit} across {count} data points.",
      },
      biggestChangeIncreased:
        "Your {signal} increased by about {pct}% between the first and second half of your data.",
      biggestChangeDecreased:
        "Your {signal} decreased by about {pct}% between the first and second half of your data.",
    },
    reportDetail: {
      myReports: "My Reports",
      notFoundTitle: "Report not found",
      notFoundDescription:
        "This report could not be loaded. It may have expired or the link is incorrect.",
      loading: "Loading report...",
      stillWorking: "Still working on your analysis...",
      autoUpdates: "This page updates automatically.",
      failedTitle: "We had trouble processing this file",
      failedDescription:
        "This can happen with unsupported or incomplete exports. Please try again.",
    },
    metrics: {
      plan: "Plan",
      sleepScore: "Sleep Score",
      recovery: "Recovery (HRV)",
      activity: "Activity",
      dataCompleteness: "Data Completeness",
      uploads: "Data Updates",
      until: "Until",
      medianFromLatest: "Median from latest",
      medianHrvFromLatest: "Median HRV from latest",
      medianRange: "Median from {start} to {end}",
      medianLatestAvailable: "Median from latest available data",
      weekTrend: {
        up: "Up vs previous week",
        down: "Down vs previous week",
        stable: "Stable vs previous week",
        unavailable: "Trend unavailable",
      },
      noRecentData: "Not enough recent data to assess this yet",
      signalCoverage: "Signal coverage",
      noUploads: "No data updates yet",
      totalAnalyses: "Total analyses",
      startByUploading: "Start by updating data",
    },
    planLabels: {
      none: "No plan",
      trialStart: "Premium Free",
      trial: "Premium Free",
      premium: "Premium",
      expired: "No plan",
    },
    sleepTrend: "Sleep — Last 14 Days with Data",
    healthBalance: "Health Balance — Last 7 Days with Data",
    latestAnalysis: {
      title: "Latest Analysis",
      noDataTitle: "Recent Analyses",
      noDataText:
        "No analyses yet. Upload an Apple Health export to get started.",
      dataAvailable:
        "Analysis data available. Explore Trends and Reports for details.",
      period: "Period",
      days: "Days",
      records: "Records",
    },
    charts: {
      sleepTrendEmpty: {
        title: "Sleep trend still building",
        message: "Your sleep pattern appears once enough data is available",
      },
      healthBalanceEmpty: {
        title: "Health balance forming",
        message: "This view appears once enough recovery data is available",
      },
    },
    insightsPage: {
      noInsights:
        "No insights yet. Upload your health data to start seeing patterns and recommendations.",
      empty:
        "Insights will appear as Engage7 finds repeated patterns in your own timeline.",
      loadError: "Insights could not be loaded right now.",
      legacyFallback: "Showing earlier-format insights from your own history.",
      legacyFormatNotice:
        "Showing insights from an earlier analysis format. As you update your data, Engage7 will use the current semantic insight format.",
      personalPattern: "Personal pattern",
      personalPatternDetected: "Personal pattern detected",
      patternFromTimeline:
        "This pattern comes from your own timeline, not population averages.",
      lastDataPoints: "Last {n} data points",
      signals: {
        sleep: "Sleep duration",
        recovery: "HRV / Heart rate",
        activity: "Steps / Active minutes",
        default: "Health signals",
      },
      confidence: {
        high: "high confidence",
        medium: "medium confidence",
        low: "low confidence",
      },
      confidenceExplanations: {
        high: "Strong pattern detected with consistent data",
        medium: "Some pattern detected, but with moderate confidence",
        low: "Limited data or weak pattern",
      },
      pillar: {
        sleep: "sleep",
        recovery: "recovery",
        activity: "activity",
      },
    },
    settings: {
      paymentSuccess:
        "Payment confirmed — your account has been upgraded to Premium.",
      paymentCancelled: "Payment was cancelled. Your plan is unchanged.",
      planBilling: "Plan & Billing",
      premiumThanks: "You are on Premium — thank you for your support.",
      freeAccessActive: "Free access active",
      premiumFreeActive: "Premium Free is active.",
      premiumFreeAccess: "You currently have Premium Free access.",
      premiumFreeEnds: "Access ends {date}.",
      daysRemaining: "{count} day{plural} remaining",
      freeAccessEnded: "Your free access period has ended.",
      noPlanActive: "No plan is active for this account.",
      premiumName: "Engage7 Premium",
      premiumDescription:
        "Full dashboard · Unlimited analyses · Longitudinal trends · Personal insights",
      premiumPrice: "€7 / month",
      upgradeToPremium: "Upgrade to Premium →",
      accountTitle: "Account",
      accountBody:
        "Your Engage7 account controls Portal access, plan state, settings, and account deletion.",
      accountNote:
        "Supabase stores login and control-plane metadata. Raw Apple Health XML is not stored in Supabase.",
      profileTitle: "Profile",
      profileBody:
        "Account details and preferences will be configurable here in a future update.",
      personalizationTitle: "Personalization",
      personalizationBody:
        "Choose a profile that best describes your situation. This helps Engage7 tailor the language and priorities shown in your Portal over time.",
      personalizationDisclaimer:
        "This is not medical interpretation. Your profile does not change DARTH thresholds, formulas, or deterministic calculations.",
      personalizationProfiles: {
        general: "General wellbeing",
        amateur_athlete: "Amateur athlete",
        student: "Student",
        entrepreneur: "Entrepreneur",
      },
      personalizationSave: "Save profile",
      personalizationSaved: "Profile saved.",
      personalizationError: "Could not save your profile. Please try again.",
      personalizationLoading: "Loading profile...",
      languageTitle: "Preferred language",
      languageBody:
        "Choose the language Engage7 should use when you sign in on future sessions.",
      languageSessionNote:
        "The header language switcher changes only this session. Saving here updates your account preference.",
      languageSaved: "Preferred language saved.",
      languageError: "Could not save this language preference.",
      exportTitle: "Export / Download",
      exportBody:
        "A self-serve export center is not available yet. Your reports remain available in My Reports, and account deletion is available below.",
      dataPrivacyTitle: "Data & Privacy",
      dataPrivacyBody:
        "Engage7 uses your Apple Health export to build a processed personal signal timeline. Raw upload files are temporary. Processed daily features and report artifacts may be kept so your Portal can show Health, Insights, Data Lab, and My Reports.",
      dataPrivacyFooter:
        "Azure Blob Storage holds raw and processed artifacts according to lifecycle rules. Supabase stores account, control-plane, report, and timeline metadata needed to run the authenticated Portal.",
      privacyItems: {
        raw: [
          "Raw ZIP/XML",
          "Temporary Azure Blob storage under lifecycle rules.",
        ],
        timeline: [
          "Processed timeline",
          "Used for Portal dashboards and freshness.",
        ],
        reports: ["Reports", "Kept so you can reopen completed analyses."],
        account: ["Account metadata", "Stored for login, plan, and settings."],
        delete: ["Delete account", "Removes app-owned account data."],
      },
      protection: {
        title: "Protect data updates",
        description:
          "Helps prevent Apple Health exports from another person being merged into your timeline. Engage7 compares privacy-minimized metadata before updating your processed timeline.",
        note: "This is not medical identity verification. It uses privacy-minimized metadata and does not expose raw Apple Health content, raw device details, date of birth, or sex in Settings. You can turn it off for testing or intentional advanced cases.",
        on: "On",
        off: "Off",
        active:
          "Protection is active. Strong mismatches may be blocked before your timeline is changed.",
        inactive:
          "Protection is off. Future updates may be accepted even when the dataset looks different from your previous timeline.",
        error: "Could not save this setting.",
        unavailable: "Protection settings are unavailable right now.",
        footprintMissing: "Footprint Missing",
        unavailableUntilTimeline:
          "Protection becomes available after a processed timeline exists.",
        readOnly:
          "Read-only admin view. Protection settings cannot be changed here.",
        timelineProtection: "Timeline protection",
        processedTimeline: "Processed timeline",
        latestDataThrough: "Latest data through",
      },
      deleteTitle: "Delete my account and data",
      deleteBody:
        "This deletes your Engage7 account and app-owned data. Reports, processed timeline metadata, data update events, and footprint records are removed by app cleanup and database cascade behavior. Temporary raw upload files are governed by Azure storage lifecycle rules. This action cannot be undone.",
      deleteButton: "Delete account",
      deletedTitle: "Account deleted",
      deletedBody: "Your Engage7 account deletion has completed. Redirecting…",
      deleteConfirmTitle: "Confirm account deletion",
      deleteConfirmBody:
        "First confirm this is your current account. Type or paste the exact account email shown below.",
      accountEmailLabel: "Current account email",
      accountEmailLoading: "Loading account email...",
      copyEmail: "Copy",
      emailCopied: "Copied",
      deleteEmailInstruction: "Confirm account email",
      deleteEmailPlaceholder: "Type your account email",
      deleteContinue: "Continue",
      deleteFinalTitle: "Delete account and data?",
      deleteFinalBody:
        "This will delete your Engage7 account and app-owned Portal data. This cannot be undone.",
      deleteFinalCancel: "No, cancel",
      deleteFinalConfirm: "Yes, delete my account and data",
      deleteFailed: "Deletion failed. Please try again.",
      deleteUnexpected: "An unexpected error occurred. Please try again.",
      deletePermanently: "Delete permanently",
      deleting: "Deleting...",
    },
    health: {
      periods: {
        today: "Today",
        last_day: "Last day",
        week: "Last week",
        month: "Last month",
        year: "Last year",
        all: "All time",
      },
      domains: {
        all: {
          title: "All",
          subtitle:
            "Sleep, recovery, and activity evidence in one consolidated Health view",
        },
        sleep: {
          title: "Sleep",
          subtitle: "Duration, stages, consistency, and sleep quality signals",
        },
        recovery: {
          title: "Recovery",
          subtitle: "HRV, heart-rate load, readiness, and baseline movement",
        },
        activity: {
          title: "Activity",
          subtitle:
            "Steps, energy, distance, and consistency across your timeline",
        },
      },
      overviewTitle: "Health",
      overviewSubtitle:
        "A compact view of sleep, recovery, and activity from your stored timeline.",
      overviewHelper:
        "Each domain uses the latest valid data available for that signal.",
      overviewUpdatedThrough: "Latest stored data through {date}",
      overviewOpenDetail: "Open detail",
      overviewNoData: "No stored values yet",
      overviewLatestValue: "Latest value",
      overviewLatestValidDay: {
        sleep: "Latest valid sleep day",
        recovery: "Latest valid recovery day",
        activity: "Latest valid activity day",
      },
      loading: "Loading health data...",
      loadError: "Health data could not be loaded.",
      unableToLoad: "Unable to load health data",
      exportToPdf: "Export to PDF",
      preparingPdf: "Preparing PDF",
      pdfExportFailed: "PDF export failed",
      ai: {
        title: "AI DARTH Performance Overview",
        subtitle: "Performance and recovery preview",
        generate: "Generate AI reflection",
        generating: "Generating...",
        badge: "AI-assisted",
        previewWarning: "Preview warning: this response would not pass Restricted Mode.",
        warningCodes: "Warning codes",
        interpretation: "Interpretation",
        whyItMatters: "Why it matters",
        errors: {
          ai_disabled: "AI is disabled for this environment.",
          feature_disabled: "This feature is disabled in Feature Admin.",
          feature_not_available: "This feature is not available for this account.",
          evidence_pack_missing: "Evidence Pack is missing for this analysis.",
          budget_exhausted: "The daily AI budget has been exhausted.",
          provider_timeout: "The AI provider timed out.",
          provider_http_503: "The AI provider is temporarily unavailable.",
          provider_empty_output: "The AI provider returned no usable output.",
          provider_schema_error: "The AI provider response did not match the expected structure.",
          provider_parse_error: "The AI provider response could not be parsed.",
          provider_failure: "The AI provider could not complete the request.",
          provider_unavailable: "The AI provider is not configured.",
          validation_failed: "The AI response did not pass validation.",
        },
      },
      todayRaw: "Today",
      todayRawWithDate: "Today: {date}",
      todayMayBePartial: "Latest stored day; may be partial.",
      latestCompleteDay: "Latest complete day available",
      latestCompleteDayWithDate: "Latest complete day available: {date}",
      comparedWithPreviousAvailableDay: "Compared with previous available day",
      noRange: "No range",
      storedDays: "{count} stored days",
      trackedDays: "{count} tracked days",
      outsidePeriod:
        "{domain} data exists outside {period}. Select a wider range to view the stored records.",
      domainMetricsMissing:
        "{domain} metrics were not present in the stored Apple Health data for this account.",
      noDomainDataInView: "No {domain} data in this view",
      sleepDurationUnavailable:
        "Sleep duration is not available in the selected range.",
      latestSleepSummary: "Latest sleep summary",
      latestRecordedSleep: "Latest recorded sleep is {value} hours.",
      sleepRangeAverage:
        "This range averages {current} hours against your all-time {allTime} hour average.",
      storedNightlySleepOnly:
        "The dashboard is using stored nightly sleep records only.",
      deepSleepTrend:
        "Deep sleep is {trend} across the latest stage-enabled sample.",
      averageDuration: "Average duration",
      latestNight: "Latest night",
      timeInBed: "Time in bed",
      transparentSleepMethod: "Transparent sleep method",
      appleHealthMayDiffer:
        "Engage7 uses exported Apple Health SleepAnalysis records: asleep/stage records estimate sleep duration, InBed is shown separately, Awake is shown when exported, and Apple Health app totals may differ because Apple can use proprietary aggregation.",
      sleepDuration: "Sleep Duration",
      sleepOnSelectedDay: "Sleep on the selected day",
      nightlySleepHours: "Nightly sleep hours",
      sleepH: "Sleep (h)",
      sleepDurationMissing: "Sleep duration missing",
      noSleepDurationValues:
        "No sleep duration values are present in this selected range.",
      sleepStages: "Sleep Stages",
      sleepStagesSubtitle:
        "Core, Deep, REM, and Awake where the export contains stages",
      stageCore: "Core",
      stageDeep: "Deep",
      stageRem: "REM",
      stageAwake: "Awake",
      sleepStagesUnavailable: "Sleep stages unavailable",
      stageSummaryNoDailyRows:
        "Stage summary exists for {count} days, but daily stage rows are not available to chart.",
      sleepStageRecordsMissing:
        "Core, Deep, REM, and Awake records are not present in this stored export.",
      weeklyPattern: "Weekly Pattern",
      weeklyPatternSubtitle:
        "Average sleep duration by weekday in the selected range",
      patternNeedsMoreDays: "Pattern needs more days",
      weekdayPatternNeedsWeek:
        "At least a week of sleep records is needed for a weekday pattern.",
      weekDays: {
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
        sun: "Sun",
      },
      consistency: "Consistency",
      efficiency: "Efficiency",
      notEnough: "Not enough",
      notEnoughBaselineData: "Not enough baseline data",
      activityInsight: "Activity insight",
      activityRangeAverageSteps:
        "This range averages {value} steps per tracked day.",
      stepDataUnavailable: "Step data is not available in this range.",
      backendActivityCoverage:
        "The latest backend activity summary includes active-energy coverage.",
      averageSteps: "Average steps",
      activeEnergy: "Active energy",
      distance: "Distance",
      stepsUnit: "steps",
      stepsTrend: "Steps Trend",
      stepsOnSelectedDay: "Steps on the selected day",
      dailySteps: "Daily steps",
      selectedDay: "Selected day",
      oneDayRangeHint:
        "This view shows one complete day. Choose a longer range to see trends.",
      steps: "Steps",
      stepsMissing: "Steps missing",
      noStepCountValues:
        "No step-count values are present in the selected range.",
      hiddenStepOutliers:
        "{count} extreme step values are hidden from chart scale.",
      energyAndDistance: "Energy and Distance",
      energyDistanceSelectedDay: "Energy and distance on the selected day",
      energyCal: "Energy (Cal)",
      distanceKm: "Distance (km)",
      energyAndDistanceUnavailable: "Energy and distance unavailable",
      energyAndDistanceUnavailableBody:
        "The stored export does not contain active energy or distance values for this range.",
      exerciseMinutesAverage:
        "Exercise minutes average {value} minutes in this range.",
      stepComparisonUnavailable: "Step comparison unavailable",
      stepComparisonUnavailableBody:
        "At least one day with step data is needed for best and lowest periods.",
      comparisonNeedsMoreDays: "Comparison needs more days",
      chooseLongerRangeForActivityComparison:
        "Choose a longer range to compare your highest and lowest activity days.",
      recoveryInsight: "Recovery insight",
      averageHrv: "Average HRV",
      averageHr: "Average HR",
      readiness: "Readiness",
      weightedCompositeSignals: "Weighted composite from available signals",
      hrvVsBaseline: "HRV vs Baseline",
      readinessForRange: "Readiness for this range is {score} out of 100.",
      noReadinessScore:
        "No readiness score is available, so the dashboard is using HRV and heart-rate signals directly.",
      hrvAverageInRange: "HRV averages {value} ms in this range.",
      hrvAndHeartRate: "HRV and Heart Rate",
      recoveryMarkersOverTime: "Recovery markers over time",
      recoveryMarkersSelectedDay: "Recovery markers on the selected day",
      hrvMs: "HRV (ms)",
      hrBpm: "HR (bpm)",
      recoverySignalsMissing: "Recovery signals missing",
      recoverySignalsMissingBody:
        "HRV and heart-rate metrics are not present in this selected range.",
      compositeScoreStored: "Composite score when stored by the backend",
      scoreUnavailable: "Score unavailable",
      scoreUnavailableBody:
        "The stored analysis did not include a recovery or readiness score.",
      baselineComparison: "Baseline Comparison",
      comparisonUnavailable: "Comparison unavailable.",
      todayNoComparison:
        "Today may be partial, so full-day comparison is not shown.",
      todayNoFullDayComparison:
        "Today may be partial; full-day comparison uses Last day.",
      latestComparedWithPrevious:
        "Latest complete day available compared with the previous available day",
      selectedRangeVsTimeline:
        "Selected range compared with your full stored timeline",
      latestVsPrevious:
        "Latest complete day available vs previous available day.",
      selectedVsTimeline: "Selected range vs full stored timeline.",
      comparisonNeedsData:
        "A comparison needs enough current and baseline data.",
      heartRate: "Heart Rate",
      activeEnergyAverage: "Active energy averages {value} calories.",
      energyDistanceSubtitle:
        "Active energy with distance overlay where available",
      bestVsLowest: "Best vs Lowest",
      stepRangeAnchors: "Step-count range anchors",
      bestDay: "Best day",
      lowestDay: "Lowest day",
      insufficientData: "Insufficient data",
    },
  },

  // Teaser (insight-preview)
  darthChrome: {
    keyFinding: "Key finding",
    evidence: "Evidence",
    confidence: "Confidence",
    adjustedConfidence: "adjusted confidence",
    currentPattern: "Current pattern",
    trajectory: "Trajectory",
    dominantSignal: "Dominant signal",
    proof: "Proof",
    consequence: "Consequence",
    action: "Action",
    lightAdjustments: "Light adjustments",
    supportingSignals: "Supporting signals",
  },

  // Teaser (insight-preview)
  teaser: {
    confidence: "confidence",
    evidenceLabel: "Evidence",
    meaningLabel: "Why this matters",
    archetypes: {
      tension: "Tension",
      strength: "Strength",
      baseline: "Baseline",
      fallback: "Pattern forming",
    },
    chartRoles: {
      evidence: "Evidence",
      impact: "Impact",
      support: "Supporting signal",
    },
    hero: {
      // Adaptive headline — driven by sleep consistency CV
      adaptiveClear:
        "Your body is showing clear patterns — here's what stands out",
      adaptiveSteady:
        "Your sleep is steady — your body is maintaining a stable rhythm",
      adaptiveShifting: "Your patterns are shifting — your body is adapting",
    },
    provenance: {
      // Three parts compose the provenance card headline (spans a highlighted year count)
      builtFrom: "Built from",
      yearsHighlight: "7 years",
      realLifeData: "of your real-life data",
    },
    visualRoles: {
      evidence: "Evidence",
      context: "Context",
    },
    visualWindows: {
      baseline_long: "Recent personal baseline",
      last_7d: "Recent week",
      last_30d: "Recent month",
    },
    visualMetrics: {
      sleep_hours: "Sleep hours",
      hrv_sdnn: "HRV",
      hrv_sdnn_mean: "HRV",
      total_steps: "Daily steps",
      active_energy_cal: "Active energy",
      available_data: "Available data",
      dataset_duration: "Dataset duration",
    },
    insights: {
      // HRV footnote shown when insight uses hrv_sdnn_mean_median metric
      hrvExplanation:
        "HRV: reflects how well your body is recovering. Higher values generally mean better recovery.",
      // Footer line under each engine insight card
      basedOnPatterns: "This is based on your recent patterns",
    },
    charts: {
      // Full chart header labels — include period descriptor inline
      sleepStages: "Sleep stages — avg per night (historical average)",
      recovery: "Readiness — trend (historical average)",
      energy: "Daily energy — avg kcal (historical average)",
    },
    empty: {
      // ChartEmptyState copy for each of the three teaser chart slots
      sleep: {
        title: "Sleep stage pattern forming",
        message: "More consistent sleep tracking will unlock this view",
      },
      recovery: {
        title: "Recovery pattern still building",
        message: "We need a few active days to understand this pattern",
      },
      energy: {
        title: "Energy pattern forming",
        message:
          "Your energy view appears once enough activity data is available",
      },
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
