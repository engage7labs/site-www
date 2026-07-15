/**
 * Portuguese (Brazil) Dictionary
 */

import type { Dictionary } from "./en-IE";

export const ptBR: Dictionary = {
  // Navigation
  nav: {
    logo: "Engage7",
    getStarted: "Executar Análise",
    login: "Login",
    portal: "Portal",
    dashboard: "Painel",
  },

  // Homepage - Hero Section
  home: {
    hero: {
      title: "Entenda seus dados de dispositivos vestíveis.",
      titleHighlight: "Claramente.",
      subtitle:
        "O Engage7 transforma sinais de dispositivos vestíveis em insights determinísticos sobre desempenho pessoal, recuperação e rotina.",
      ctaPrimary: "Executar Análise",
      ctaSecondary: "Como Funciona",
      trustBadge: "Insights determinísticos dos seus dados",
      trustLine1: "Sem necessidade de conta",
      trustLine2: "Seus dados permanecem seus",
      trustLine3: "Análise ~1 minuto",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "Três pilares de clareza",
      sectionSubtitle:
        "Projetado para fornecer insights explicáveis em que você pode confiar.",

      deterministic: {
        title: "Baseado nos Seus Padrões",
        description:
          "Analisamos seus dados e identificamos o que realmente está acontecendo. Cada insight vem dos seus próprios padrões, não de previsões.",
      },

      explainable: {
        title: "Fácil de Entender",
        description:
          "Veja o que está acontecendo com seu sono, recuperação e movimento. Linguagem clara, sem jargão.",
      },

      privacy: {
        title: "Seus Dados Permanecem Seus",
        description:
          "Analisamos seus dados para gerar insights, mas não treinamos modelos de IA com eles nem os compartilhamos.",
      },
    },

    // How Engage7 Works Section
    howItWorks: {
      sectionTitle: "Como o Engage7 funciona",
      sectionSubtitle:
        "Quatro etapas dos dados brutos para insights claros e explicáveis",

      step1: {
        title: "Carregar conjunto de dados",
        description:
          "Forneça sua exportação do Apple Health como um arquivo .zip padrão",
      },

      step2: {
        title: "Detectar seu padrão pessoal",
        description:
          "O Engage7 analisa seus padrões individuais para criar uma referência pessoal recente",
      },

      step3: {
        title: "Aplicar regras determinísticas",
        description:
          "Regras de processamento transparentes identificam sinais e tendências significativos",
      },

      step4: {
        title: "Gerar resumo de insights",
        description:
          "Receba um relatório claro e acionável com descobertas explicáveis",
      },
    },

    // Example Report Section
    exampleReport: {
      sectionTitle: "O que esperar",
      sectionSubtitle: "Veja que tipo de insights você receberá da sua análise",
      cardTitle: "Relatório de Análise de Exemplo",
      cardSubtitle: "Estrutura de saída de exemplo",

      sampleSummary: {
        title: "Resumo Executivo",
        description:
          "Visão geral de alto nível das principais descobertas e padrões detectados no seu conjunto de dados",
      },

      sampleBaseline: {
        title: "Janela de Linha de Base",
        description:
          "Suas faixas normais fisiológicas individuais para frequência cardíaca, HRV e recuperação",
      },

      sampleSignals: {
        title: "Sinais Principais",
        description:
          "Padrões, anomalias ou tendências significativas identificadas em sono, atividade e recuperação",
      },

      sampleStatus: {
        title: "Padrão Geral",
        description:
          "Avaliação consciente do contexto do seu estado fisiológico recente",
      },

      viewSampleCTA: "Ver relatório de exemplo",
      learnMoreCTA: "Saiba mais sobre nossa metodologia",
    },

    productPreview: {
      title: "Veja o tipo de insight que você vai receber",
      subtitle:
        "Veja como o Engage7 transforma seu export do Apple Health em orientação diária, tendências de saúde e padrões pessoais.",
      labels: {
        dailyGuidance: "Orientação diária",
        compareImprove: "Comparar e melhorar",
        healthOverview: "Visão de saúde",
        sleepTrends: "Tendências de sono",
        recoveryTrends: "Tendências de recuperação",
        activityTrends: "Tendências de atividade",
      },
      controls: {
        previous: "Prévia anterior",
        next: "Próxima prévia",
        close: "Fechar prévia",
        open: "Abrir prévia",
      },
    },

    // FAQ Section
    faq: {
      sectionTitle: "Perguntas Frequentes",

      q1: {
        question: "Quais dados posso carregar?",
        answer:
          "Atualmente, o Engage7 suporta exportações do Apple Health. Exporte seus dados como um arquivo .zip do aplicativo Saúde no seu iPhone e carregue-o aqui.",
      },

      q2: {
        question: "Que tipo de insights vou receber?",
        answer:
          "Você receberá um relatório de análise determinística cobrindo padrões de sono, tendências de atividade e sinais de recuperação. Todos os insights são explicáveis e derivados do seu padrão pessoal recente.",
      },

      q3: {
        question: "Meus dados são usados para treinar modelos de IA?",
        answer:
          "Não. Seu conjunto de dados é processado usando regras determinísticas para gerar sua análise pessoal. Não treinamos modelos de IA externos com seus dados.",
      },

      q4: {
        question: "Isso é aconselhamento médico?",
        answer:
          "Não. O Engage7 fornece apenas insights informativos. Os resultados não constituem aconselhamento médico e não devem substituir a consulta com profissionais de saúde qualificados.",
      },

      q5: {
        question: "Quanto tempo leva a análise?",
        answer:
          "A maioria das análises é concluída em 30–90 segundos, dependendo do tamanho do seu conjunto de dados.",
      },

      q6: {
        question: "O que acontece com meus dados após a análise?",
        answer:
          "Seu arquivo carregado e resultados de análise são armazenados temporariamente para gerar seu relatório. Você mantém a propriedade total dos seus dados e pode solicitar a exclusão a qualquer momento.",
      },
    },

    // Technology Stack
    techStack: {
      title: "Construído com tecnologias confiáveis",
    },

    // Community Activity
    communityActivity: {
      title: "Atividade da Comunidade",
      totalUploads: "Total de Análises",
      recentUploads: "Análises (24h)",
      languages: "Idiomas",
      activeUsers: "Usuários Ativos",
      loading: "Carregando métricas...",
      error: "Métricas indisponíveis",
    },

    // Final CTA Section
    cta: {
      title: "Pronto para entender seus dados?",
      subtitle:
        "Carregue seu conjunto de dados, execute uma análise determinística e revise um resultado claro em que você pode confiar.",
      ctaPrimary: "Executar Análise",
      ctaSecondary: "Saiba Como Funciona",
    },

    // Footer
    footer: {
      copyright: "© 2026 Engage7 Labs. Todos os direitos reservados.",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      contact: "Contato",
      research: "Pesquisa",
    },
  },

  // Analyze Page
  analyze: {
    title: "Analise seus dados de saúde",
    subtitle:
      "Exporte do app Saúde no seu iPhone e carregue o arquivo aqui. Mostraremos padrões de sono, recuperação e movimento baseados no que é normal para você.",

    workflow: {
      title: "Como funciona",
      step1: {
        title: "Carregar Dados",
        description: "Forneça sua exportação do Apple Health",
      },
      step2: {
        title: "Processamento",
        description: "Análise determinística executada em seus dados",
      },
      step3: {
        title: "Resultados",
        description: "Revise insights explicáveis e tendências",
      },
    },

    upload: {
      title: "Carregue sua exportação do Apple Health",
      description: "Formato suportado: exportação do Apple Health (export.zip)",
      dragHint: "Arraste e solte seu arquivo aqui, ou clique para procurar",
      fileSelected: "Arquivo selecionado:",
      analyzing: "Analisando...",
      buttonUpload: "Carregar e Analisar",
      buttonUploading: "Carregando...",
      buttonProcessing: "Processando...",
      formatHint: "Formato suportado: exportação do Apple Health (.zip)",
      expectationHint: "A análise geralmente é concluída em 30–90 segundos.",
    },

    consent: {
      title: "Consentimento para processamento de dados",
      description:
        "Confirmo que este conjunto de dados me pertence e autorizo o Engage7 a processá-lo com o objetivo de gerar um relatório de análise determinístico.",
      disclaimer:
        "Entendo que os resultados são informativos e não constituem aconselhamento médico.",
      linkText: "Leia nossa Política de Privacidade",
      required: "Você deve consentir para continuar",
    },

    trust: {
      title: "Seus dados permanecem seus",
      point1: "Arquivo usado apenas para esta análise",
      point2: "Sem treinamento de modelos de IA externos",
      point3: "Regras de processamento determinísticas",
    },

    privacy: {
      title: "Seus dados permanecem seus",
      point1: "Seu arquivo é usado apenas para análise",
      point2: "Sem treinamento em modelos de IA externos",
      point3: "Processamento segue regras determinísticas",
      point4: "Resultados gerados a partir do seu padrão pessoal recente",
    },

    backToHome: "Voltar para Início",
  },

  // Result Page
  result: {
    title: "Resultado da Análise",
    loading: "Carregando seus resultados...",

    status: {
      pending: "Processando",
      processing: "Analisando seus dados",
      completed: "Análise Concluída",
      failed: "Análise Falhou",
    },
    processingView: {
      uploadingTitle: "Enviando seus dados",
      uploadingBody:
        "Mantenha esta aba aberta enquanto transferimos seu arquivo com segurança.",
      uploadingFootnote:
        "Exportações grandes do Apple Health podem levar um momento.",
      analyzingTitle: "Analisando seus dados",
      analyzingBody: "Normalmente termina em 30-90 segundos",
      delayedTitle: "Ainda estamos trabalhando na sua análise...",
      delayedBody:
        "Está levando mais tempo que o esperado, mas ainda estamos processando seus dados.",
    },

    summary: {
      title: "Resumo Executivo",
      datasetPeriod: "Período do Conjunto de Dados",
      recordsAnalyzed: "Registros Analisados",
      insightsGenerated: "Insights Gerados",
    },

    insights: {
      title: "Principais Insights",
      noInsights: "Nenhum insight disponível",
    },

    preview: {
      backToHome: "Voltar para Início",
      subtitle: "Sua prévia de insights pessoais",
      sleepHero: {
        title: "Algo interessante aconteceu",
        titleHighlight: "nos seus dados de sono.",
        emptyState:
          "Seus dados de sono foram analisados. Explore seus padrões abaixo.",
        curiosPrompt: "Veja como sua recuperação se conecta ao seu sono.",
        mobileCuriousPrompt: "Veja seus padrões de recuperação e atividade.",
        ctaRecovery: "Ver padrões de recuperação",
      },
      sections: {
        sleepPattern: "Padrão de Sono",
        recovery: "Recuperação",
        activityMobility: "Atividade e Mobilidade",
      },
      cta: {
        exploreRecovery: "Explorar recuperação",
        exploreActivity: "Explorar atividade",
        viewMovement: "Ver detalhes de movimento",
      },
      emptyChart: "Dados insuficientes para visualizar.",
      emptyInsights: "Dados insuficientes para gerar este insight ainda.",
      insightsInEnglish: "Insights gerados em inglês",
      dataReveals: "Seus dados revelam",
      basedOnAnalysis: "Baseado na sua análise",
      builtFromPrefix: "Construído com",
      builtFromSuffix: "dos seus dados pessoais",
      provenanceLabel: "Seus dados",
      comparePlans: "Comparar planos",
      plans: {
        free: {
          name: "Grátis",
          tagline: "Comece com seus dados",
          singleUpload: "Upload único de análise",
          previewInsights: "Prévia de insights (sono, recuperação, atividade)",
          basicTrend: "Visualização básica de tendências",
        },
        premium: {
          name: "Premium",
          tagline: "Experiência completa de insights",
          longitudinal: "Insights longitudinais em todos os sinais",
          baseline: "Comparações com padrão pessoal recente",
          actionable: "Sugestões acionáveis de melhoria",
          dashboard: "Painel de saúde privado completo",
          export: "Exportação de relatório PDF & CSV",
        },
        superPremium: {
          name: "Super Premium",
          tagline: "Módulos de análise avançada",
          everything: "Tudo do Premium",
          advancedRecovery: "Análise avançada de recuperação",
          circadian: "Mapeamento de ritmo circadiano",
          multiPeriod: "Comparação de tendências multi-período",
          comingSoon: "* Módulos avançados em desenvolvimento",
        },
      },
      fullReport: {
        title: "Veja sua evolução completa",
        description:
          "Veja tendências ao longo do tempo, correlações entre seus sinais e acesse seu portal pessoal — grátis por 90 dias.",
        downloadButton: "Abrir meu Portal Premium Free",
        runAnother: "Executar outra análise",
        emailWarning:
          "Não conseguimos enviar as instruções de entrada agora. Tente novamente.",
        checkEmail:
          "Verifique seu e-mail para confirmar sua identidade; depois abriremos seu Portal.",
      },
      protectedHandoff: {
        title: "Atualize seu Portal existente",
        description:
          "Esta exportação parece corresponder a uma linha do tempo protegida no Engage7. Entre para continuar.",
        cta: "Entrar para atualizar meu Portal",
      },
    },

    artifacts: {
      title: "Relatório e Artefatos",
      downloadPDF: "Baixar Relatório PDF",
      downloadData: "Baixar Dados Processados",
    },
    premiumModal: {
      title: "Abra seu Portal Premium Free",
      description:
        "Salve esta análise e libere 90 dias de acesso Premium Free.",
      google: "Continuar com Google",
      apple: "Continuar com Apple",
      appleLoading: "Entrando com Apple...",
      appleError: "Não foi possível continuar com Apple. Tente novamente ou use e-mail.",
      divider: "ou",
      emailLabel: "Seu email",
      emailRequired: "O email é necessário para liberar o Premium Free.",
      emailInvalid: "Informe um endereço de email válido.",
      consent:
        "Concordo em armazenar meus insights de saúde processados para que o Engage7 mostre tendências e insights no Portal. Posso excluir esses dados a qualquer momento nas configurações do Portal.",
      success: "Seu acesso Premium Free de 90 dias começou",
      genericError: "Algo deu errado. Tente novamente.",
      opening: "Abrindo seu Portal...",
      open: "Abrir meu Portal Premium Free",
    },
    protectedHandoffModal: {
      title: "Entre para atualizar seu Portal",
      body: "Este arquivo parece corresponder a uma timeline Engage7 já protegida. Entre na sua conta para continuar a atualização dos seus dados.",
      button: "Entrar para atualizar meu Portal",
      blocked:
        "Este arquivo parece corresponder a uma timeline Engage7 já protegida. Entre com a conta correspondente para continuar.",
      genericError:
        "Ainda não foi possível continuar esta atualização protegida.",
    },

    error: {
      title: "Erro na Análise",
      description:
        "Ocorreu um erro durante a análise. Por favor, tente novamente ou entre em contato com o suporte.",
      retryButton: "Tentar Novamente",
      notFoundTitle: "Resultado não encontrado",
      notFoundDescription:
        "Este job de análise não foi encontrado. Ele pode ter expirado ou o link pode estar incorreto.",
      failedTitle: "Tivemos dificuldade para processar este arquivo",
      failedHint:
        "Isso pode acontecer com exportações não suportadas ou incompletas. Você pode tentar novamente com outro arquivo.",
      calmDefault:
        "Não conseguimos concluir sua análise. Tente enviar novamente.",
      calmTimeout:
        "Sua análise demorou mais que o esperado. Tente novamente — a maioria dos arquivos processa em menos de dois minutos.",
      calmInterrupted:
        "Sua análise foi interrompida. Isso pode acontecer em períodos de alto tráfego. Tente novamente.",
      calmStalled:
        "Sua análise não terminou o processamento. Tente enviar novamente.",
      calmMissing:
        "Alguns resultados não estavam disponíveis após o processamento. Tente novamente.",
      calmNetwork:
        "Não conseguimos conectar para processar seus dados. Verifique sua conexão e tente novamente.",
      calmInvalid:
        "Não conseguimos ler os dados deste arquivo. Confirme que você está enviando uma exportação do Apple Health (.zip).",
    },

    backToAnalyze: "Executar Outra Análise",
    backToHome: "Voltar para Início",
  },

  // Common
  common: {
    loading: "Carregando...",
    error: "Erro",
    retry: "Tentar Novamente",
    cancel: "Cancelar",
    close: "Fechar",
    save: "Salvar",
    saving: "Salvando...",
    saved: "Salvo",
    next: "Próximo",
    previous: "Anterior",
    viewDetails: "Ver Detalhes",
    yes: "Sim",
    no: "Não",
    available: "Disponível",
    unavailable: "Indisponível",
    notAvailable: "Não disponível",
    unknown: "Desconhecido",
    updateData: "Atualizar Dados",
    signOut: "Sair",
    readOnly: "somente leitura",
    tryAgain: "Tentar novamente",
    redirecting: "Redirecionando...",
    status: {
      completed: "Concluído",
      complete: "Completo",
      failed: "Falhou",
      imported: "Importado",
      updated: "Atualizado",
      processing: "Processando",
      queued: "Na fila",
      valid: "Válido",
      estimated: "Estimado",
      insufficient: "Insuficiente",
      unavailable: "Indisponível",
      missing: "Ausente",
      publicActive: "Público ativo",
      publicExpired: "Público expirado",
      userOwned: "Do usuário",
      linked: "Vinculado",
      protected: "Protegido",
      cleanupCandidates: "Candidatos à limpeza",
    },
    metrics: {
      sleepDuration: "Duração do sono",
      sleepStages: "Estágios do sono",
      hrv: "VFC",
      restingHeartRate: "Frequência cardíaca de repouso",
      heartRate: "Frequência cardíaca",
      recoveryScore: "Pontuação de recuperação",
      readiness: "Prontidão",
      bodyMassChange: "Mudança de massa corporal",
      steps: "Passos",
      activeEnergy: "Energia ativa",
      distance: "Distância",
      activeMinutes: "Minutos ativos",
      consistency: "Consistência",
      efficiency: "Eficiência",
      baseline: "Linha de base",
      personalBaseline: "Linha de base pessoal",
    },
  },

  auth: {
    login: {
      title: "Entrar no Engage7",
      portalLabel: "Portal do Usuário",
      subtitle: "Sistema de insights pessoais - seus dados permanecem seus",
      apple: "Continuar com Apple",
      appleLoading: "Entrando com Apple...",
      appleError: "Não foi possível continuar com Apple. Tente novamente ou use e-mail.",
      google: "Continuar com Google",
      googleLoading: "Entrando com Google...",
      googleError:
        "Não foi possível continuar com Google. Tente novamente ou use e-mail.",
      divider: "Ou continue com e-mail",
      signIn: "Entrar",
      signingIn: "Entrando...",
      createAccount: "Criar conta",
      creatingAccount: "Criando conta...",
      accountCreated: "Conta criada - você já pode entrar.",
      recoverAccess: "Recuperar acesso",
      forgotPassword: "Esqueceu a senha?",
      email: "E-mail",
      sendCode: "Enviar código",
      verificationCode: "Digite o código de verificação",
      verifyCode: "Verificar código",
      resendCode: "Reenviar código",
      otpSent: "Se a conta estiver elegível, um código de seis dígitos foi enviado.",
      otpError: "Não foi possível verificar o código. Solicite um novo e tente novamente.",
      usePassword: "Usar senha",
      useEmailCode: "Usar código por e-mail",
      adminDenied: "Esta conta não está autorizada para o Portal Administrativo.",
      password: "Senha",
      confirmPassword: "Confirmar senha",
      passwordMismatch: "As senhas não coincidem",
      genericError: "Algo deu errado",
      tryAgain: "Algo deu errado. Tente novamente.",
    },
    callback: {
      loading: "Configurando seu acesso ao Engage7...",
      invalid: "Link inválido ou expirado. Solicite um novo link.",
      generic:
        "Não foi possível concluir o acesso. Tente novamente ou use outro método.",
      identityMismatch:
        "Este método de acesso já está conectado a outra conta Engage7.",
      connection: "Erro de conexão. Tente novamente.",
      back: "Voltar para o login",
    },
    forgot: {
      checkEmailTitle: "Verifique seu email",
      checkEmailBody:
        "Se existir uma conta para este email, enviaremos instruções de recuperação.",
      title: "Redefinir sua senha",
      body: "Informe seu email e enviaremos um link para redefinir sua senha.",
      send: "Enviar link de redefinição",
      backToLogin: "Voltar ao login",
      deliveryFailed:
        "Não conseguimos enviar o email agora. Tente novamente mais tarde.",
      genericError: "Algo deu errado",
      networkError: "Erro de rede — tente novamente",
    },
    reset: {
      linkUnavailableTitle: "Link indisponível",
      linkUnavailableBody:
        "Este link já foi usado ou expirou. Solicite um novo link de acesso.",
      requestNewLink: "Solicitar novo link",
      accessCodeCreated: "Código de acesso criado",
      passwordUpdated: "Senha atualizada",
      takingToPortal: "Levando você para o Portal Engage7...",
      passwordSet: "Sua senha foi definida. Você já pode entrar.",
      signIn: "Entrar",
      createAccessCode: "Crie seu código de acesso",
      setPassword: "Defina sua senha",
      welcomeBody:
        "Escolha um código de acesso para retornar ao Portal Engage7 quando quiser.",
      resetBody: "Escolha uma senha forte para sua conta Engage7.",
      accessCodePlaceholder: "Código de acesso (mín. 8 caracteres)",
      passwordPlaceholder: "Nova senha (mín. 8 caracteres)",
      confirmAccessCode: "Confirmar código de acesso",
      confirmPassword: "Confirmar senha",
      mismatch: "As senhas não coincidem",
      passwordMismatch: "Os códigos não coincidem",
      submitAccessCode: "Criar código de acesso",
      submitPassword: "Definir senha",
      failed: "Falha ao redefinir a senha",
      networkError: "Erro de rede — tente novamente",
    },
  },

  feedback: {
    helpful: "Isso foi útil?",
    thanks: "Obrigado pelo feedback.",
  },

  // Privacy Policy
  privacyPolicy: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: 8 de março de 2026",
    intro:
      "O Engage7 está comprometido em proteger sua privacidade. Esta política explica como lidamos com seus dados ao usar nosso serviço de análise.",
    sections: {
      dataCollection: {
        title: "Coleta de Dados",
        content:
          "Quando você carrega um conjunto de dados para análise, processamos o arquivo para gerar insights determinísticos. Você mantém a propriedade de seus dados.",
      },
      dataUsage: {
        title: "Uso de Dados",
        content:
          "Seu conjunto de dados é usado exclusivamente para gerar seu relatório de análise. Não treinamos modelos de IA externos com seus dados. O processamento segue regras determinísticas baseadas em linhas de base fisiológicas.",
      },
      dataStorage: {
        title: "Armazenamento de Dados",
        content:
          "Os resultados da análise e arquivos carregados são armazenados temporariamente para gerar seu relatório. Não vendemos nem compartilhamos seus dados com terceiros.",
      },
      dataRights: {
        title: "Seus Direitos",
        content:
          "Você mantém a propriedade total de seus dados. Por padrão, o Engage7 não retém conjuntos de dados identificáveis ou resultados de análise além do operacionalmente necessário. Se recursos de armazenamento persistente ou histórico de conta forem introduzidos no futuro, eles exigirão seu consentimento explícito e serão acompanhados de termos de privacidade atualizados.",
      },
    },
    backToHome: "Voltar para Início",
  },

  // Terms of Service
  termsOfService: {
    title: "Termos de Serviço",
    lastUpdated: "Última atualização: 8 de março de 2026",
    intro:
      "Ao usar o Engage7, você concorda com estes termos. Por favor, leia-os com atenção.",
    sections: {
      serviceDescription: {
        title: "Descrição do Serviço",
        content:
          "O Engage7 fornece análise determinística de dados de dispositivos vestíveis. O serviço gera insights informativos baseados nos seus padrões pessoais de recuperação, atividade e rotina.",
      },
      userResponsibilities: {
        title: "Responsabilidades do Usuário",
        content:
          "Você é responsável por garantir que tem o direito de carregar qualquer conjunto de dados que enviar. Você deve ser o proprietário dos dados ou ter permissão para processá-los.",
      },
      disclaimer: {
        title: "Aviso Médico",
        content:
          "Os resultados do Engage7 são informativos e não constituem aconselhamento médico. Sempre consulte profissionais de saúde qualificados para decisões médicas.",
      },
      serviceChanges: {
        title: "Alterações no Serviço",
        content:
          "O Engage7 pode evoluir com o tempo. Reservamos o direito de modificar ou descontinuar recursos à medida que o serviço se desenvolve.",
      },
      limitation: {
        title: "Limitação de Responsabilidade",
        content:
          "O Engage7 é fornecido como está. Não fazemos garantias sobre a precisão ou completude dos resultados da análise.",
      },
    },
    backToHome: "Voltar para Início",
  },

  // Contact Page
  contact: {
    title: "Entre em Contato",
    subtitle: "Tem perguntas? Adoraríamos ouvir de você.",
    linkedin: {
      heading: "Conecte-se no LinkedIn",
      description:
        "Entre em contato com Rodrigo Marques no LinkedIn para perguntas, feedback ou oportunidades de colaboração.",
      button: "Abrir Perfil no LinkedIn",
    },
    backToHome: "Voltar para Início",
  },

  // Friends Page
  friends: {
    title: "Convide Amigos",
    subtitle:
      "Compartilhe o Engage7 com amigos e ajude-os a entender seus dados de dispositivos vestíveis também.",
    shareTitle: "Compartilhar Engage7",
    shareDescription:
      "Escolha uma plataforma para compartilhar o Engage7 com sua rede.",
    shareText:
      "Acabei de analisar meus dados de dispositivos vestíveis com o Engage7 — insights determinísticos sobre meus padrões de desempenho e recuperação. Experimente você também!",
    copyLink: "Copiar Link",
    copied: "Copiado!",
    backToHome: "Voltar para Início",

    socialProof: {
      title: "Atividade da Comunidade",
      totalUploads: "Total de Análises",
      recentUploads: "Análises (24h)",
      languages: "Idiomas",
      activeUsers: "Usuários Ativos",
      loading: "Carregando métricas...",
      error: "Métricas indisponíveis",
    },
  },

  // Portal
  portal: {
    loading: "Carregando…",
    shell: {
      sections: {
        overview: {
          title: "Visão geral",
          subtitle: "Seus dados de saúde em um resumo",
        },
        reports: {
          title: "Meus relatórios",
          subtitle: "Revise seus relatórios de saúde gerados",
        },
        dataLab: {
          title: "Data Lab",
          subtitle:
            "Evidências avançadas, tendências e contexto técnico da sua análise.",
        },
        insights: {
          title: "Insights",
          subtitle:
            "Padrões detectados nos seus dados — baseados no seu histórico, não em médias gerais",
        },
        settings: {
          title: "Configurações",
          subtitle: "Gerencie suas preferências do Portal",
        },
        upload: {
          title: "Atualizar Dados",
          subtitle: "Atualize sua linha do tempo do Apple Health",
        },
        health: {
          title: "Saúde",
          subtitle: "Sono, Recuperação e Atividade ao longo do tempo",
        },
        all: {
          title: "Todos",
          subtitle: "Sono, Recuperação e Atividade juntos",
        },
        sleep: {
          title: "Sono",
          subtitle: "Duração, estágios, consistência e eficiência do sono",
        },
        recovery: {
          title: "Recuperação",
          subtitle:
            "VFC, frequência cardíaca, prontidão e comparação com padrão pessoal recente",
        },
        activity: {
          title: "Atividade",
          subtitle: "Passos, energia, distância e consistência de atividade",
        },
      },
      claimImported: "Sua análise pública agora está no seu Portal.",
      claimAlreadyImported: "Esta análise já está no seu Portal.",
      claimReady: "Sua análise está pronta para importação.",
      claimRetryDescription:
        "Não conseguimos importá-la automaticamente. Você pode tentar novamente agora.",
      retry: "Tentar novamente",
      imported: "Análise importada.",
      importStillFailed:
        "A importação ainda não foi concluída. Tente novamente mais tarde.",
      protectedClaimBlocked:
        "Esta análise está vinculada a outra linha do tempo protegida. Entre com a conta correta para continuar.",
      claimEmailMismatch:
        "Esta análise foi liberada com outro e-mail. Entre com o mesmo e-mail usado para abrir o Premium Free ou inicie uma nova análise para esta conta.",
    },
    accessCode: {
      bannerPrefix: "Proteja seu acesso —",
      bannerLink: "crie um código de acesso",
      bannerSuffix: "para voltar de qualquer dispositivo.",
      title: "Crie seu código de acesso",
      description:
        "Escolha um código pessoal para voltar ao seu painel de qualquer dispositivo. Use pelo menos 8 caracteres e evite códigos comuns ou fáceis de adivinhar.",
      save: "Salvar código de acesso",
      weakPassword:
        "Escolha um código de acesso mais forte. Evite códigos comuns ou fáceis de adivinhar e combine diferentes tipos de caracteres.",
      genericError: "Algo deu errado — tente novamente",
      networkError: "Erro de rede — tente novamente",
    },
    signInMethods: {
      title: "Métodos de entrada conectados",
      body: "Estes métodos entram na mesma conta Engage7.",
      email: "E-mail",
      apple: "Apple",
      google: "Google",
      connected: "Conectado",
      notConnected: "Não conectado",
      newPassword: "Nova senha do Engage7",
      addPassword: "Adicionar senha",
      connectGoogle: "Conectar Google",
      connectApple: "Conectar Apple",
      legacyPassword: "A entrada por senha permanece disponível durante a transição para E-mail.",
      appleError: "Não foi possível conectar a Apple. Este método pode já pertencer a outra conta Engage7.",
      passwordConnected: "Senha conectada.",
      weakPassword:
        "Escolha uma senha mais forte. Evite senhas comuns ou fáceis de adivinhar e combine diferentes tipos de caracteres.",
      reauthenticate: "Entre novamente antes de alterar os métodos de entrada.",
      googleError: "Não foi possível conectar o Google. Tente novamente.",
    },
    compareImprove: {
      title: "Comparar e melhorar",
      compare: "Comparar",
      interpret: "Interpretar",
      improve: "Melhorar",
      range: "intervalo",
      labels: {
        sleep: "Duração do sono",
        hr: "Frequência cardíaca de repouso",
        hrv: "Variabilidade da frequência cardíaca",
        steps: "Passos diários",
      },
      details: {
        sleepGood: "Sua duração do sono está dentro de uma faixa saudável.",
        sleepLow: "Seu sono está mais curto que a faixa saudável típica.",
        sleepHigh:
          "Seu sono está mais longo que o necessário para a maioria das pessoas.",
        hrGood:
          "Sua frequência cardíaca de repouso está em uma faixa confortável.",
        hrLow:
          "Sua frequência cardíaca de repouso está abaixo da média — muitas vezes sinal de bom condicionamento.",
        hrHigh:
          "Sua frequência cardíaca de repouso está mais alta. Estresse, hidratação e condicionamento podem influenciar isso.",
        hrvGood: "Sua VFC sugere um sistema nervoso bem equilibrado.",
        hrvLow:
          "Sua VFC está mais baixa, o que pode refletir estresse acumulado.",
        hrvHigh:
          "Sua VFC está bem alta — normalmente sinal de boa capacidade de recuperação.",
        stepsGood: "Sua atividade diária está em uma faixa sustentável.",
        stepsLow:
          "Sua contagem de passos está abaixo da faixa comumente recomendada.",
        stepsHigh:
          "Você está muito ativo — garanta que a recuperação acompanhe o ritmo.",
      },
      interpretations: {
        sleepRecoveryAligned: "Sono e recuperação estão alinhados",
        sleepRecoveryAlignedBody:
          "Sua duração do sono apoia a recuperação do sistema nervoso. Este é um sinal positivo forte.",
        sleepRecoveryPressure: "Sono e recuperação estão sob pressão",
        sleepRecoveryPressureBody:
          "Sono mais curto junto com VFC mais baixa sugere que seu corpo pode se beneficiar de descanso mais consistente.",
        sleepGoodRecoveryLag: "Bom sono, mas recuperação atrasada",
        sleepGoodRecoveryLagBody:
          "Você está dormindo o suficiente, mas sua VFC continua baixa. Fatores como estresse ou horários inconsistentes podem estar envolvidos.",
        activeEfficient:
          "Estilo de vida ativo com resposta cardiovascular eficiente",
        activeEfficientBody:
          "Seu movimento diário é sólido e sua frequência cardíaca de repouso fica baixa — sinal de bom condicionamento cardiovascular.",
        lowerActivityHigherHr:
          "Menos atividade e frequência cardíaca de repouso mais alta",
        lowerActivityHigherHrBody:
          "Menos movimento diário tende a acompanhar frequência cardíaca de repouso mais alta. Pequenos aumentos de atividade podem ajudar.",
        variablePatterns: "Sono e atividade estão variáveis",
        variablePatternsBody:
          "Sua rotina varia mais que a média de um dia para outro. Estabilizar sono ou movimento pode criar um efeito positivo nos dois.",
        consistentPattern: "Padrão de estilo de vida consistente",
        consistentPatternBody:
          "Seu sono e sua atividade estão estáveis no dia a dia. Essa consistência apoia energia e recuperação confiáveis.",
        sleepAffectsHr:
          "O sono tem efeito mensurável na sua frequência cardíaca",
        sleepAffectsHrLower:
          "Nos seus dados, mais sono tende a reduzir sua frequência cardíaca. Essa conexão é forte o suficiente para acompanhar ao longo do tempo.",
        sleepAffectsHrHigher:
          "Nos seus dados, mais sono se associa a uma frequência cardíaca ligeiramente mais alta. Essa conexão é forte o suficiente para acompanhar ao longo do tempo.",
      },
      improvements: {
        earlierBedtime: "Tente dormir 20 minutos mais cedo nesta semana",
        earlierBedtimeReason:
          "Sua mediana de sono é {current}h — até uma pequena mudança para {target}h pode melhorar como você se sente.",
        consistentBedtime:
          "Escolha um horário de dormir consistente pelos próximos 5 dias",
        consistentBedtimeReason:
          "Seu horário de sono varia bastante. Um horário fixo, mesmo nos fins de semana, ajuda a estabilizar sua energia.",
        lunchWalk: "Adicione uma caminhada de 10 minutos depois do almoço",
        lunchWalkReason:
          "Seus passos diários ficam em torno de {steps}. Uma caminhada curta é a forma mais simples de aumentar isso.",
        recoveryBalance:
          "Equilibre muita atividade com tempo deliberado de recuperação",
        recoveryBalanceReason:
          "Você se movimenta bastante, mas sua frequência cardíaca de repouso sugere que seu corpo pode precisar de mais pausa.",
        slowBreathing: "Tente 5 minutos de respiração lenta antes de dormir",
        slowBreathingReason:
          "Sua VFC está mais baixa. Respiração guiada pode ativar o sistema parassimpático e apoiar a recuperação.",
        maintainRoutine:
          "Mantenha o que está fazendo — seus sinais de recuperação estão fortes",
        maintainRoutineReason:
          "Bom sono e VFC saudável sugerem que sua rotina atual funciona bem.",
        hydrationStress: "Observe hidratação e estresse nesta semana",
        hydrationStressReason:
          "Uma frequência cardíaca de repouso de {hr} bpm está mais alta. Hidratação e manejo do estresse podem ajudar.",
        keepUploading:
          "Continue enviando dados regularmente para insights mais ricos",
        keepUploadingReason:
          "Mais pontos de dados permitem identificar tendências e dar sugestões melhores e mais personalizadas.",
      },
    },
    statusNotice: {
      noAnalysis:
        "Nenhuma análise foi criada ainda. Atualize sua linha do tempo do Apple Health para iniciar o Portal.",
      processing:
        "Sua análise mais recente ainda está processando. Os cartões disponíveis do Portal serão atualizados quando terminar.",
      failed:
        "A análise mais recente não foi concluída. Os dados existentes do Portal continuam visíveis quando disponíveis.",
      importing: "Sua análise pública está sendo importada para o Portal.",
      darthMissing:
        "Os dados da análise estão disponíveis, mas a camada de orientação atual ainda não está pronta para esta análise.",
      timelineMissing:
        "Os dados da análise estão disponíveis, mas a linha do tempo longitudinal ainda não está disponível para esta conta.",
    },
    headerSubtitle: {
      timelineUpdatedThrough: "Linha do tempo atualizada até {date}",
      noRecentAnalysis:
        "Nenhuma análise recente ainda. Atualize Dados para renovar sua linha do tempo do Apple Health.",
      latestAnalysisAvailable: "A análise mais recente está disponível.",
      latestAnalysisFrom: "Análise mais recente disponível desde {date}",
    },
    shareCard: {
      title: "Compartilhar Engage7",
      description:
        "Compartilhe a página do produto com amigos — não seus dados.",
      button: "Compartilhar",
    },
    dataLab: {
      title: "Data Lab",
      subtitle:
        "Evidências avançadas, tendências e contexto técnico da sua análise.",
      advancedReference: "Análise avançada para referência.",
      correlationDisclaimer: "Correlações não implicam causalidade.",
      periodLabel: "Janela de evidência",
      period30Days: "30 dias",
      period90Days: "90 dias",
      periodAll: "Todos os dados",
      evidenceWindow: "Janela de evidência",
      evidenceWindowDescription:
        "Proveniência transparente e qualidade dos dados na janela longitudinal selecionada.",
      analyses: "Análises",
      observations: "Observações",
      signals: "Sinais",
      dateRange: "Intervalo",
      exportCsv: "Exportar CSV",
      descriptiveStatistics: "Estatística descritiva",
      descriptiveStatisticsDescription:
        "Estatísticas amostrais calculadas apenas com valores observados; dados ausentes nunca viram zero.",
      signal: "Sinal",
      missing: "Ausentes",
      coverage: "Cobertura de dias observados",
      mean: "Média",
      median: "Mediana",
      standardDeviation: "DP amostral",
      coefficientVariation: "CV",
      range: "Amplitude",
      maxGap: "Maior intervalo",
      days: "dias",
      noData: "Sem dados",

      loading: "Carregando...",
      loadError:
        "Os dados avançados de tendência não puderam ser carregados agora.",
      empty:
        "O Data Lab aparecerá quando o Engage7 tiver dados suficientes de análises concluídas.",
      unavailable:
        "Esta análise tem dados do Portal, mas os resultados avançados do Data Lab ainda não estão disponíveis. Insights e Saúde ainda podem estar disponíveis.",
      technicalDataAvailable: "Dados técnicos disponíveis",
      technicalDataDescription:
        "O Data Lab mostra evidências de apoio quando os resultados avançados existem para esta análise.",
      available: "Disponível",
      unavailableLabel: "Indisponível",
      trendCharts: "Gráficos de tendência",
      trendChartsAvailable:
        "Movimento longitudinal dos sinais ao longo do tempo.",
      trendChartsUnavailable:
        "Dados avançados de tendência ainda não estão disponíveis para esta análise.",
      baselineRanges: "Padrão pessoal recente",
      baselineRangesTitle: "Seu padrão pessoal recente",
      baselineRangesDescription:
        "Sua faixa de referência pessoal a partir dos dados históricos disponíveis.",
      baselineUnavailable:
        "Dados de padrão pessoal recente indisponíveis para este conjunto de dados.",
      correlations: "Correlações",
      signalCorrelations: "Correlações entre sinais",
      signalCorrelationsReference: "Correlações entre sinais (referência)",
      correlationsAvailable:
        "Sinais que se moveram juntos no seu histórico. Isso não prova causa e efeito.",
      correlationsUnavailable:
        "Dados de correlação indisponíveis para este conjunto de dados.",
      volatility: "Volatilidade",
      volatilityAvailable: "Quanto um sinal variou no período selecionado.",
      volatilityUnavailable:
        "Dados de volatilidade indisponíveis para este conjunto de dados.",
      dataPoints: "{count} pontos de dados",
      averageSleep: "Sono médio",
      averageHrv: "VFC média",
      averageRestingHeartRate: "Frequência cardíaca de repouso média",
      averageDailySteps: "Passos diários médios",
      hours: "horas",
      steps: "passos",
      sleepTrend: "Tendência de sono",
      recoveryTrend: "Tendência de recuperação",
      activityTrend: "Tendência de atividade",
      sleepDuration: "Duração do sono",
      restingHeartRate: "Frequência cardíaca de repouso",
      dailySteps: "Passos diários",
      activeMinutes: "Minutos ativos",
      weeklySleepPatterns: "Padrões semanais de sono",
      weeklySleepPatternsDescription: "Sono médio por dia da semana",
      whatChangedMost: "O que mais mudou",
      trendNarrative: {
        rising:
          "Seu sinal de {signal} vem subindo, atualmente em torno de {latest} {unit} (média: {mean} {unit}).",
        falling:
          "Seu sinal de {signal} vem caindo, atualmente em torno de {latest} {unit} (média: {mean} {unit}).",
        stable:
          "Seu sinal de {signal} ficou estável em torno de {mean} {unit} ao longo de {count} pontos de dados.",
      },
      biggestChangeIncreased:
        "Seu sinal de {signal} aumentou cerca de {pct}% entre a primeira e a segunda metade dos seus dados.",
      biggestChangeDecreased:
        "Seu sinal de {signal} diminuiu cerca de {pct}% entre a primeira e a segunda metade dos seus dados.",
    },
    reportDetail: {
      myReports: "Meus relatórios",
      notFoundTitle: "Relatório não encontrado",
      notFoundDescription:
        "Este relatório não pôde ser carregado. Ele pode ter expirado ou o link pode estar incorreto.",
      loading: "Carregando relatório...",
      stillWorking: "Ainda trabalhando na sua análise...",
      autoUpdates: "Esta página é atualizada automaticamente.",
      failedTitle: "Tivemos dificuldade para processar este arquivo",
      failedDescription:
        "Isso pode acontecer com exportações incompatíveis ou incompletas. Tente novamente.",
    },
    metrics: {
      plan: "Plano",
      sleepScore: "Pontuação de Sono",
      recovery: "Recuperação (VFC)",
      activity: "Atividade",
      dataCompleteness: "Completude dos Dados",
      uploads: "Envios",
      until: "Até",
      medianFromLatest: "Mediana da última análise",
      medianHrvFromLatest: "VFC mediana da última análise",
      medianRange: "Mediana de {start} até {end}",
      medianLatestAvailable: "Mediana dos dados mais recentes disponíveis",
      weekTrend: {
        up: "Subiu vs semana anterior",
        down: "Desceu vs semana anterior",
        stable: "Estável vs semana anterior",
        unavailable: "Tendência indisponível",
      },
      noRecentData: "Dados insuficientes para avaliar isso ainda",
      signalCoverage: "Cobertura de sinais",
      noUploads: "Nenhum envio ainda",
      totalAnalyses: "Total de análises",
      startByUploading: "Comece enviando dados",
    },
    planLabels: {
      none: "Sem plano",
      trialStart: "Premium Free",
      trial: "Premium Free",
      premium: "Premium",
      expired: "Sem plano",
    },
    sleepTrend: "Sono — Últimos 14 Dias com Dados",
    healthBalance: "Equilíbrio de Saúde — Últimos 7 Dias com Dados",
    latestAnalysis: {
      title: "Análise Mais Recente",
      noDataTitle: "Análises Recentes",
      noDataText:
        "Nenhuma análise ainda. Envie uma exportação do Apple Health para começar.",
      dataAvailable:
        "Dados de análise disponíveis. Explore Tendências e Relatórios para detalhes.",
      period: "Período",
      days: "Dias",
      records: "Registros",
    },
    charts: {
      sleepTrendEmpty: {
        title: "Tendência de sono ainda em formação",
        message: "Seu padrão de sono aparece quando houver dados suficientes",
      },
      healthBalanceEmpty: {
        title: "Equilíbrio de saúde em formação",
        message:
          "Esta visualização aparece quando houver dados de recuperação suficientes",
      },
    },
    insightsPage: {
      noInsights:
        "Nenhum insight ainda. Envie seus dados de saúde para começar a ver padrões e recomendações.",
      empty:
        "Os insights aparecerão quando o Engage7 encontrar padrões repetidos na sua própria linha do tempo.",
      loadError: "Os insights não puderam ser carregados agora.",
      legacyFallback: "Mostrando insights de um formato de análise anterior.",
      legacyFormatNotice:
        "Mostrando insights de um formato de análise anterior. Ao atualizar seus dados, o Engage7 usará o formato semântico atual de insights.",
      personalPattern: "Padrão pessoal",
      personalPatternDetected: "Padrão pessoal detectado",
      patternFromTimeline:
        "Este padrão vem da sua própria linha do tempo, não de médias populacionais.",
      lastDataPoints: "Últimos {n} pontos de dados",
      signals: {
        sleep: "Duração do sono",
        recovery: "VFC / Frequência cardíaca",
        activity: "Passos / Minutos ativos",
        default: "Sinais de saúde",
      },
      confidence: {
        high: "alta confiança",
        medium: "confiança média",
        low: "baixa confiança",
      },
      confidenceExplanations: {
        high: "Padrão forte detectado com dados consistentes",
        medium: "Algum padrão detectado, mas com confiança moderada",
        low: "Dados limitados ou padrão fraco",
      },
      pillar: {
        sleep: "sono",
        recovery: "recuperação",
        activity: "atividade",
      },
    },
    settings: {
      paymentSuccess:
        "Pagamento confirmado — sua conta foi atualizada para Premium.",
      paymentCancelled:
        "O pagamento foi cancelado. Seu plano não foi alterado.",
      planBilling: "Plano e cobrança",
      premiumThanks: "Você está no Premium — obrigado pelo apoio.",
      freeAccessActive: "Acesso gratuito ativo",
      premiumFreeActive: "Premium Free está ativo.",
      premiumFreeAccess: "Você está com acesso Premium Free ativo.",
      premiumFreeEnds: "O acesso termina em {date}.",
      daysRemaining: "{count} dia{plural} restante{plural}",
      freeAccessEnded: "Seu período de acesso gratuito terminou.",
      noPlanActive: "Nenhum plano está ativo para esta conta.",
      premiumName: "Engage7 Premium",
      premiumDescription:
        "Painel completo · Análises ilimitadas · Tendências longitudinais · Insights pessoais",
      premiumPrice: "€7 / mês",
      upgradeToPremium: "Atualizar para Premium →",
      accountTitle: "Conta",
      accountBody:
        "Sua conta Engage7 controla o acesso ao Portal, estado do plano, configurações e exclusão da conta.",
      accountNote:
        "O Supabase armazena metadados de login e controle. O XML bruto do Apple Health não é armazenado no Supabase.",
      profileTitle: "Perfil",
      profileBody:
        "Detalhes da conta e preferências serão configuráveis aqui em uma atualização futura.",
      personalizationTitle: "Personalização",
      personalizationBody:
        "Escolha um perfil que melhor descreva sua situação. Isso ajuda o Engage7 a adaptar a linguagem e as prioridades exibidas no seu Portal ao longo do tempo.",
      personalizationDisclaimer:
        "Isso não é interpretação médica. Seu perfil não altera os limiares fisiológicos, as fórmulas DARTH ou os cálculos de saúde.",
      personalizationProfiles: {
        general: "Bem-estar geral",
        amateur_athlete: "Atleta amador",
        student: "Estudante",
        entrepreneur: "Empreendedor",
      },
      personalizationSave: "Salvar perfil",
      personalizationSaved: "Perfil salvo.",
      personalizationError:
        "Não foi possível salvar seu perfil. Tente novamente.",
      personalizationLoading: "Carregando perfil...",
      languageTitle: "Idioma preferido",
      languageBody:
        "Escolha o idioma que o Engage7 deve usar quando você entrar em sessões futuras.",
      languageSessionNote:
        "O seletor de idioma no cabeçalho altera apenas esta sessão. Salvar aqui atualiza a preferência da sua conta.",
      languageSaved: "Idioma preferido salvo.",
      languageError: "Não foi possível salvar esta preferência de idioma.",
      exportTitle: "Exportar / baixar",
      exportBody:
        "Um centro de exportação self-service ainda não está disponível. Seus relatórios permanecem em Meus relatórios, e a exclusão da conta está disponível abaixo.",
      dataPrivacyTitle: "Dados e privacidade",
      dataPrivacyBody:
        "O Engage7 usa sua exportação do Apple Health para construir uma linha do tempo fisiológica processada. Arquivos brutos enviados são temporários. Recursos diários processados e artefatos de relatório podem ser mantidos para que o Portal mostre Saúde, Insights, Data Lab e Meus relatórios.",
      dataPrivacyFooter:
        "O Azure Blob Storage mantém artefatos brutos e processados conforme regras de ciclo de vida. O Supabase armazena metadados de conta, controle, relatório e linha do tempo necessários para operar o Portal autenticado.",
      privacyItems: {
        raw: [
          "ZIP/XML bruto",
          "Armazenamento temporário no Azure Blob conforme regras de ciclo de vida.",
        ],
        timeline: [
          "Linha do tempo processada",
          "Usada para painéis do Portal e atualização dos dados.",
        ],
        reports: [
          "Relatórios",
          "Mantidos para que você possa reabrir análises concluídas.",
        ],
        account: [
          "Metadados da conta",
          "Armazenados para login, plano e configurações.",
        ],
        delete: ["Excluir conta", "Remove dados da conta pertencentes ao app."],
      },
      protection: {
        title: "Proteger atualizações de dados",
        description:
          "Ajuda a evitar que exportações do Apple Health de outra pessoa sejam mescladas à sua linha do tempo. O Engage7 compara metadados minimizados antes de atualizar sua linha do tempo processada.",
        note: "Isto não é verificação de identidade médica. Usa metadados minimizados e não expõe conteúdo bruto do Apple Health, detalhes brutos de dispositivos, data de nascimento ou sexo nas Configurações. Você pode desativar para testes ou casos avançados intencionais.",
        on: "Ativado",
        off: "Desativado",
        active:
          "A proteção está ativa. Divergências fortes podem ser bloqueadas antes que sua linha do tempo seja alterada.",
        inactive:
          "A proteção está desativada. Atualizações futuras podem ser aceitas mesmo quando o conjunto de dados parecer diferente da linha do tempo anterior.",
        error: "Não foi possível salvar esta configuração.",
        unavailable: "As configurações de proteção estão indisponíveis agora.",
        footprintMissing: "Footprint ausente",
        unavailableUntilTimeline:
          "A proteção fica disponível depois que uma linha do tempo processada existir.",
        readOnly:
          "Visualização administrativa somente leitura. As configurações de proteção não podem ser alteradas aqui.",
        timelineProtection: "Proteção da linha do tempo",
        processedTimeline: "Linha do tempo processada",
        latestDataThrough: "Dados mais recentes até",
      },
      deleteTitle: "Excluir minha conta e dados",
      deleteBody:
        "Isto exclui sua conta Engage7 e os dados pertencentes ao app. Relatórios, metadados da linha do tempo processada, eventos de atualização de dados e registros de footprint são removidos pela limpeza do app e por cascata do banco de dados. Arquivos brutos temporários seguem as regras de ciclo de vida do Azure Storage. Esta ação não pode ser desfeita.",
      deleteButton: "Excluir conta",
      deletedTitle: "Conta excluída",
      deletedBody:
        "A exclusão da sua conta Engage7 foi concluída. Redirecionando…",
      deleteConfirmTitle: "Confirmar exclusão da conta",
      deleteConfirmBody:
        "Primeiro confirme que esta é sua conta atual. Digite ou cole exatamente o email da conta mostrado abaixo.",
      accountEmailLabel: "Email da conta atual",
      accountEmailLoading: "Carregando email da conta...",
      copyEmail: "Copiar",
      emailCopied: "Copiado",
      deleteEmailInstruction: "Confirme o email da conta",
      deleteEmailPlaceholder: "Digite o email da sua conta",
      deleteContinue: "Continuar",
      deleteFinalTitle: "Excluir conta e dados?",
      deleteFinalBody:
        "Isto excluirá sua conta Engage7 e os dados do Portal pertencentes ao app. Esta ação não pode ser desfeita.",
      deleteFinalCancel: "Não, cancelar",
      deleteFinalConfirm: "Sim, excluir minha conta e dados",
      deleteFailed: "A exclusão falhou. Tente novamente.",
      deleteUnexpected: "Ocorreu um erro inesperado. Tente novamente.",
      deleteSessionChanged:
        "Sua sessão mudou. Reabra as Configurações antes de excluir uma conta.",
      deletePermanently: "Excluir permanentemente",
      deleting: "Excluindo...",
    },
    health: {
      periods: {
        today: "Hoje",
        last_day: "Último dia",
        week: "Última semana",
        month: "Último mês",
        year: "Último ano",
        all: "Todo o período",
      },
      domains: {
        all: {
          title: "Todos",
          subtitle:
            "Evidências de sono, recuperação e atividade em uma visão de Saúde consolidada",
        },
        sleep: {
          title: "Sono",
          subtitle:
            "Duração, estágios, consistência e sinais de qualidade do sono",
        },
        recovery: {
          title: "Recuperação",
          subtitle:
            "VFC, carga cardíaca, prontidão e movimento contra padrão pessoal recente",
        },
        activity: {
          title: "Atividade",
          subtitle:
            "Passos, energia, distância e consistência ao longo do tempo",
        },
      },
      overviewTitle: "Saúde",
      overviewSubtitle:
        "Uma visão compacta de sono, recuperação e atividade a partir da sua linha do tempo armazenada.",
      overviewHelper:
        "Cada domínio usa o dado válido mais recente disponível para aquele sinal.",
      overviewUpdatedThrough: "Dados armazenados mais recentes até {date}",
      overviewOpenDetail: "Abrir detalhe",
      overviewNoData: "Ainda sem valores armazenados",
      overviewLatestValue: "Valor mais recente",
      overviewLatestValidDay: {
        sleep: "Último dia válido de sono",
        recovery: "Último dia válido de recuperação",
        activity: "Último dia válido de atividade",
      },
      loading: "Carregando dados de saúde...",
      loadError: "Os dados de saúde não puderam ser carregados.",
      unableToLoad: "Não foi possível carregar os dados de saúde",
      exportToPdf: "Exportar para PDF",
      preparingPdf: "Preparando PDF",
      pdfExportFailed: "Falha ao exportar PDF",
      ai: {
        title: "Visão DARTH de desempenho com IA",
        subtitle: "Prévia de desempenho e recuperação",
        generate: "Gerar reflexão com IA",
        generating: "Gerando...",
        badge: "Assistido por IA",
        previewWarning:
          "Aviso de Preview: esta resposta não passaria no modo restrito.",
        warningCodes: "Códigos de aviso",
        interpretation: "Interpretação",
        whyItMatters: "Por que importa",
        errors: {
          ai_disabled: "A IA está desativada neste ambiente.",
          feature_disabled: "Este recurso está desativado no Feature Admin.",
          feature_not_available: "Este recurso não está disponível para esta conta.",
          evidence_pack_missing: "O Evidence Pack está ausente nesta análise.",
          budget_exhausted: "O orçamento diário de IA foi esgotado.",
          provider_timeout: "O provedor de IA excedeu o tempo limite.",
          provider_http_503: "O provedor de IA está temporariamente indisponível.",
          provider_empty_output: "O provedor de IA não retornou saída utilizável.",
          provider_schema_error: "A resposta do provedor de IA não seguiu a estrutura esperada.",
          provider_parse_error: "A resposta do provedor de IA não pôde ser interpretada.",
          provider_failure: "O provedor de IA não concluiu a solicitação.",
          provider_unavailable: "O provedor de IA não está configurado.",
          validation_failed: "A resposta de IA não passou na validação.",
        },
      },
      todayRaw: "Hoje",
      todayRawWithDate: "Hoje: {date}",
      todayMayBePartial: "Último dia armazenado; pode estar parcial.",
      latestCompleteDay: "Último dia completo disponível",
      latestCompleteDayWithDate: "Último dia completo disponível: {date}",
      comparedWithPreviousAvailableDay:
        "Comparado com o dia disponível anterior",
      noRange: "Sem intervalo",
      storedDays: "{count} dias armazenados",
      trackedDays: "{count} dias rastreados",
      outsidePeriod:
        "Há dados de {domain} fora de {period}. Selecione um período mais amplo para ver os registros armazenados.",
      domainMetricsMissing:
        "As métricas de {domain} não estavam presentes nos dados armazenados do Apple Health desta conta.",
      noDomainDataInView: "Sem dados de {domain} nesta visualização",
      sleepDurationUnavailable:
        "A duração do sono não está disponível no período selecionado.",
      latestSleepSummary: "Resumo do sono mais recente",
      latestRecordedSleep: "O sono registrado mais recente é de {value} horas.",
      sleepRangeAverage:
        "Este intervalo tem média de {current} horas contra sua média histórica de {allTime} horas.",
      storedNightlySleepOnly:
        "O painel está usando apenas registros de sono noturno armazenados.",
      deepSleepTrend:
        "O sono profundo está {trend} na amostra mais recente com estágios.",
      averageDuration: "Duração média",
      latestNight: "Noite mais recente",
      timeInBed: "Tempo na cama",
      transparentSleepMethod: "Método transparente de sono",
      appleHealthMayDiffer:
        "O Engage7 usa registros SleepAnalysis exportados do Apple Health: registros dormindo/estágios estimam a duração do sono, Na cama aparece separadamente, Acordado aparece quando exportado, e os totais do app Saúde podem diferir porque a Apple pode usar agregação proprietária.",
      sleepDuration: "Duração do sono",
      sleepOnSelectedDay: "Sono no dia selecionado",
      nightlySleepHours: "Horas de sono por noite",
      sleepH: "Sono (h)",
      sleepDurationMissing: "Duração do sono ausente",
      noSleepDurationValues:
        "Nenhum valor de duração do sono está presente neste intervalo selecionado.",
      sleepStages: "Estágios do sono",
      sleepStagesSubtitle:
        "Essencial, profundo, REM e acordado quando a exportação contém estágios",
      stageCore: "Essencial",
      stageDeep: "Profundo",
      stageRem: "REM",
      stageAwake: "Acordado",
      sleepStagesUnavailable: "Estágios do sono indisponíveis",
      stageSummaryNoDailyRows:
        "Existe resumo de estágios para {count} dias, mas as linhas diárias de estágio não estão disponíveis para gráfico.",
      sleepStageRecordsMissing:
        "Registros de essencial, profundo, REM e acordado não estão presentes nesta exportação armazenada.",
      weeklyPattern: "Padrão semanal",
      weeklyPatternSubtitle:
        "Duração média do sono por dia da semana no intervalo selecionado",
      patternNeedsMoreDays: "O padrão precisa de mais dias",
      weekdayPatternNeedsWeek:
        "É necessária pelo menos uma semana de registros de sono para um padrão por dia da semana.",
      weekDays: {
        mon: "seg",
        tue: "ter",
        wed: "qua",
        thu: "qui",
        fri: "sex",
        sat: "sáb",
        sun: "dom",
      },
      consistency: "Consistência",
      efficiency: "Eficiência",
      notEnough: "Insuficiente",
      notEnoughBaselineData: "Dados de padrão pessoal recente insuficientes",
      activityInsight: "Insight de atividade",
      activityRangeAverageSteps:
        "Este intervalo tem média de {value} passos por dia rastreado.",
      stepDataUnavailable:
        "Os dados de passos não estão disponíveis neste intervalo.",
      backendActivityCoverage:
        "O resumo de atividade mais recente do backend inclui cobertura de energia ativa.",
      averageSteps: "Passos médios",
      activeEnergy: "Energia ativa",
      distance: "Distância",
      stepsUnit: "passos",
      stepsTrend: "Tendência de passos",
      stepsOnSelectedDay: "Passos no dia selecionado",
      dailySteps: "Passos diários",
      selectedDay: "Dia selecionado",
      oneDayRangeHint:
        "Esta visão mostra um dia completo. Escolha um período maior para ver tendências.",
      steps: "Passos",
      stepsMissing: "Passos ausentes",
      noStepCountValues:
        "Nenhum valor de contagem de passos está presente no intervalo selecionado.",
      hiddenStepOutliers:
        "{count} valores extremos de passos estão ocultos da escala do gráfico.",
      energyAndDistance: "Energia e distância",
      energyDistanceSelectedDay: "Energia e distância no dia selecionado",
      energyCal: "Energia (Cal)",
      distanceKm: "Distância (km)",
      energyAndDistanceUnavailable: "Energia e distância indisponíveis",
      energyAndDistanceUnavailableBody:
        "A exportação armazenada não contém valores de energia ativa ou distância para este intervalo.",
      exerciseMinutesAverage:
        "Minutos de exercício têm média de {value} minutos neste intervalo.",
      stepComparisonUnavailable: "Comparação de passos indisponível",
      stepComparisonUnavailableBody:
        "É necessário pelo menos um dia com dados de passos para comparar melhor e menor período.",
      comparisonNeedsMoreDays: "A comparação precisa de mais dias",
      chooseLongerRangeForActivityComparison:
        "Escolha um período maior para comparar seus dias de maior e menor atividade.",
      recoveryInsight: "Insight de recuperação",
      averageHrv: "VFC média",
      averageHr: "FC média",
      readiness: "Prontidão",
      weightedCompositeSignals: "Composição ponderada dos sinais disponíveis",
      hrvVsBaseline: "VFC vs padrão pessoal recente",
      readinessForRange: "A prontidão neste intervalo é {score} de 100.",
      noReadinessScore:
        "Nenhuma pontuação de prontidão está disponível, então o painel usa diretamente VFC e sinais de frequência cardíaca.",
      hrvAverageInRange: "A VFC média é {value} ms neste intervalo.",
      hrvAndHeartRate: "VFC e frequência cardíaca",
      recoveryMarkersOverTime: "Marcadores de recuperação ao longo do tempo",
      recoveryMarkersSelectedDay:
        "Marcadores de recuperação no dia selecionado",
      hrvMs: "VFC (ms)",
      hrBpm: "FC (bpm)",
      recoverySignalsMissing: "Sinais de recuperação ausentes",
      recoverySignalsMissingBody:
        "As métricas de VFC e frequência cardíaca não estão presentes neste intervalo selecionado.",
      compositeScoreStored: "Pontuação composta quando armazenada pelo backend",
      scoreUnavailable: "Pontuação indisponível",
      scoreUnavailableBody:
        "A análise armazenada não incluiu pontuação de recuperação ou prontidão.",
      baselineComparison: "Comparação com padrão pessoal recente",
      comparisonUnavailable: "Comparação indisponível.",
      todayNoComparison:
        "Hoje pode estar parcial, então a comparação de dia completo não é exibida.",
      todayNoFullDayComparison:
        "Hoje pode estar parcial; a comparação de dia completo usa Último dia.",
      latestComparedWithPrevious:
        "Último dia completo disponível comparado com o dia disponível anterior",
      selectedRangeVsTimeline:
        "Intervalo selecionado comparado com toda a linha do tempo armazenada",
      latestVsPrevious:
        "Último dia completo disponível vs dia disponível anterior.",
      selectedVsTimeline:
        "Intervalo selecionado vs toda a linha do tempo armazenada.",
      comparisonNeedsData:
        "Uma comparação precisa de dados atuais e de padrão pessoal recente suficientes.",
      heartRate: "Frequência cardíaca",
      activeEnergyAverage: "Energia ativa média de {value} calorias.",
      energyDistanceSubtitle:
        "Energia ativa com sobreposição de distância quando disponível",
      bestVsLowest: "Melhor vs menor",
      stepRangeAnchors: "Referências do intervalo de passos",
      bestDay: "Melhor dia",
      lowestDay: "Menor dia",
      insufficientData: "Dados insuficientes",
    },
  },

  darthChrome: {
    keyFinding: "Principal achado",
    evidence: "Evidência",
    confidence: "Confiança",
    adjustedConfidence: "confiança ajustada",
    currentPattern: "Padrão atual",
    trajectory: "Trajetória",
    dominantSignal: "Sinal dominante",
    proof: "Prova",
    consequence: "Consequência",
    action: "Ação",
    lightAdjustments: "Ajustes leves",
    supportingSignals: "Sinais de apoio",
  },

  // Teaser (insight-preview)
  teaser: {
    confidence: "confiança",
    evidenceLabel: "Evidência",
    meaningLabel: "Por que isso importa",
    archetypes: {
      tension: "Tensão",
      strength: "Força",
      baseline: "Linha de base",
      fallback: "Padrão em formação",
    },
    chartRoles: {
      evidence: "Evidência",
      impact: "Impacto",
      support: "Sinal de apoio",
    },
    hero: {
      adaptiveClear:
        "Seu corpo está mostrando padrões claros — aqui está o que se destaca",
      adaptiveSteady:
        "Seu sono está estável — seu corpo está mantendo um ritmo regular",
      adaptiveShifting:
        "Seus padrões estão mudando — seu corpo está se adaptando",
    },
    provenance: {
      builtFrom: "Construído a partir de",
      yearsHighlight: "7 anos",
      realLifeData: "dos seus dados reais",
    },
    visualRoles: {
      evidence: "Evidência",
      context: "Contexto",
    },
    visualWindows: {
      baseline_long: "Padrão pessoal recente",
      last_7d: "Semana recente",
      last_30d: "Mês recente",
    },
    visualMetrics: {
      sleep_hours: "Horas de sono",
      hrv_sdnn: "VFC",
      hrv_sdnn_mean: "VFC",
      total_steps: "Passos diários",
      active_energy_cal: "Energia ativa",
      available_data: "Dados disponíveis",
      dataset_duration: "Duração do conjunto de dados",
    },
    insights: {
      hrvExplanation:
        "VFC: indica como seu corpo está se recuperando. Valores mais altos geralmente significam melhor recuperação.",
      basedOnPatterns: "Baseado nos seus padrões recentes",
    },
    charts: {
      sleepStages: "Estágios do sono — média por noite (média histórica)",
      recovery: "Prontidão — tendência (média histórica)",
      energy: "Energia diária — média kcal (média histórica)",
    },
    empty: {
      sleep: {
        title: "Padrão de estágios do sono em formação",
        message:
          "Rastreamento de sono mais consistente desbloqueará esta visualização",
      },
      recovery: {
        title: "Padrão de recuperação ainda sendo construído",
        message: "Precisamos de alguns dias ativos para entender este padrão",
      },
      energy: {
        title: "Padrão de energia em formação",
        message:
          "Sua visualização de energia aparece quando houver dados de atividade suficientes",
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
    copyLink: "Copiar Link",
    copied: "Copiado!",
  },
};
