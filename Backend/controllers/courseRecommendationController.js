const CourseRecommendation = require("../models/courseRecommendation");
const QuizAttempt = require("../models/quizAttempt");
const Quiz = require("../models/quiz");
const QuizQuestion = require("../models/quizQuestion");
const axios = require("axios");
const groq = require("../config/groq");

// Generate course recommendations based on quiz results
exports.generateRecommendations = async (userId, quizId, attemptId) => {
  try {
    // Vérifier si une recommandation existe déjà pour cette tentative
    const existingRecommendation = await CourseRecommendation.findOne({
      user: userId,
      quiz: quizId,
      quizAttempt: attemptId
    });

    if (existingRecommendation) {
      console.log("Recommendations already exist for this attempt");
      return existingRecommendation;
    }

    // Récupérer les détails de la tentative
    const attempt = await QuizAttempt.findById(attemptId)
      .populate({
        path: "answers.question",
        model: "QuizQuestion"
      });

    if (!attempt) {
      console.error("Quiz attempt not found");
      return null;
    }

    // Récupérer les détails du quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.error("Quiz not found");
      return null;
    }

    // Si le score est parfait, pas besoin de recommandations
    if (attempt.score === attempt.maxScore) {
      console.log("Perfect score, no recommendations needed");
      return null;
    }

    // Identifier les questions incorrectes
    const incorrectAnswers = attempt.answers.filter(answer => !answer.isCorrect);

    if (incorrectAnswers.length === 0) {
      console.log("No incorrect answers found");
      return null;
    }

    // Préparer les données pour l'API OpenAI
    console.log("Préparation des données pour l'API OpenAI...");

    // Extraire le texte des questions incorrectes
    const incorrectQuestionsText = incorrectAnswers.map(answer => answer.question.questionText);

    // Obtenir la catégorie du quiz
    const quizCategory = quiz.category;

    // Déterminer le niveau de difficulté recommandé en fonction du score
    const percentage = (attempt.score / attempt.maxScore) * 100;
    let recommendedDifficulty = 'Intermédiaire';

    if (percentage < 40) {
      recommendedDifficulty = 'Débutant';
    } else if (percentage >= 70) {
      recommendedDifficulty = 'Avancé';
    }

    // Définir les plateformes de cours en ligne
    const platforms = [
      {
        name: "Coursera",
        baseUrl: "https://www.coursera.org/courses?query=",
        imageUrl: "https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png"
      },
      {
        name: "Udemy",
        baseUrl: "https://www.udemy.com/courses/search/?src=ukw&q=",
        imageUrl: "https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg"
      },
      {
        name: "edX",
        baseUrl: "https://www.edx.org/search?q=",
        imageUrl: "https://www.edx.org/images/logos/edx-logo-elm.svg"
      },
      {
        name: "Khan Academy",
        baseUrl: "https://www.khanacademy.org/search?page_search_query=",
        imageUrl: "https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png"
      },
      {
        name: "FutureLearn",
        baseUrl: "https://www.futurelearn.com/search?q=",
        imageUrl: "https://www.futurelearn.com/assets/fl-logo.svg"
      }
    ];

    try {
      console.log("Appel de l'API GROQ...");

      // Construire le prompt pour l'API GROQ
      const prompt = `
Je suis un système de recommandation de cours en ligne. Un utilisateur vient de terminer un quiz dans la catégorie "${quizCategory}" avec un score de ${percentage}% (niveau recommandé: ${recommendedDifficulty}).

L'utilisateur a répondu incorrectement aux questions suivantes:
${incorrectQuestionsText.map((q, i) => `${i+1}. ${q}`).join('\n')}

Basé sur ces questions manquées, recommande 5 cours en ligne pertinents qui aideraient l'utilisateur à améliorer ses connaissances dans ces domaines spécifiques.

Pour chaque cours, fournis:
1. Un titre accrocheur et pertinent
2. Une description détaillée (environ 2 phrases)
3. La plateforme de cours (choisir parmi: Coursera, Udemy, edX, Khan Academy, FutureLearn)
4. Le niveau de difficulté (utiliser EXACTEMENT l'une de ces valeurs: "Débutant", "Intermédiaire", "Avancé", "Expert")
5. Un score de pertinence entre 1 et 10 basé sur la correspondance avec les questions manquées

IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après. Ne pas inclure de backticks ou de délimiteurs de code. Voici le format exact à utiliser:

{
  "courses": [
    {
      "title": "Titre du cours",
      "description": "Description du cours",
      "platform": "Nom de la plateforme",
      "difficulty": "Niveau de difficulté",
      "relevanceScore": 8
    },
    ...
  ]
}

Assure-toi que ton JSON est valide et peut être parsé directement par JSON.parse().
`;

      // Appeler l'API GROQ
      const response = await groq.chat.completions.create({
        model: "llama3-8b-8192",  // Utiliser le modèle Llama 3 de GROQ (version 8B qui est disponible gratuitement)
        messages: [
          { role: "system", content: "Tu es un expert en éducation spécialisé dans la recommandation de cours en ligne personnalisés." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      console.log("Réponse reçue de l'API GROQ");

      // Extraire les recommandations de la réponse
      const aiResponse = response.choices[0].message.content;
      console.log("Contenu brut de la réponse:", aiResponse.substring(0, 200) + "..."); // Afficher les 200 premiers caractères

      let recommendedCourses;

      try {
        // Tenter d'extraire le JSON de la réponse
        // Parfois, le modèle ajoute du texte avant ou après le JSON
        let jsonStr = aiResponse;

        // Chercher le début du JSON (caractère '{')
        const startIdx = aiResponse.indexOf('{');
        // Chercher la fin du JSON (dernier caractère '}')
        const endIdx = aiResponse.lastIndexOf('}');

        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
          // Extraire seulement la partie JSON
          jsonStr = aiResponse.substring(startIdx, endIdx + 1);
          console.log("JSON extrait:", jsonStr.substring(0, 100) + "...");
        }

        // Tenter de parser la réponse JSON
        const parsedResponse = JSON.parse(jsonStr);
        recommendedCourses = parsedResponse.courses;

        // Vérifier si les cours ont été correctement extraits
        if (!recommendedCourses || !Array.isArray(recommendedCourses) || recommendedCourses.length === 0) {
          throw new Error("Format de réponse invalide");
        }
      } catch (parseError) {
        console.error("Erreur lors du parsing de la réponse de l'API:", parseError);

        // Tenter d'extraire des recommandations de cours du texte
        try {
          console.log("Tentative d'extraction de recommandations à partir du texte...");

          // Si la réponse contient des informations sur des cours, essayons de les extraire
          const textResponse = aiResponse;
          const courseRecommendations = [];

          // Rechercher des motifs qui indiquent des cours
          // Par exemple: "1. Titre du cours", "Cours 1:", etc.
          const courseMatches = textResponse.match(/(?:\d+\.\s+|\*\s+|Cours\s+\d+\s*:\s*)([^\n]+)(?:\n|$)/g);

          if (courseMatches && courseMatches.length > 0) {
            console.log(`${courseMatches.length} cours potentiels trouvés dans le texte`);

            // Pour chaque correspondance, créer une recommandation de cours
            courseMatches.slice(0, 5).forEach((match, index) => {
              // Nettoyer le titre
              const title = match.replace(/^\d+\.\s+|\*\s+|Cours\s+\d+\s*:\s*/g, '').trim();

              // Chercher une description dans les lignes suivantes
              const titleIndex = textResponse.indexOf(match);
              const nextSection = textResponse.substring(titleIndex + match.length, titleIndex + 500);
              const description = nextSection.split('\n')[0].trim();

              // Déterminer la plateforme (chercher des mots-clés)
              let platform = "Coursera"; // Par défaut
              if (nextSection.toLowerCase().includes("udemy")) platform = "Udemy";
              else if (nextSection.toLowerCase().includes("edx")) platform = "edX";
              else if (nextSection.toLowerCase().includes("khan")) platform = "Khan Academy";
              else if (nextSection.toLowerCase().includes("futurelearn")) platform = "FutureLearn";

              courseRecommendations.push({
                title: title || `Cours sur ${quizCategory}`,
                description: description || `Ce cours vous aidera à améliorer vos connaissances en ${quizCategory}.`,
                platform,
                difficulty: recommendedDifficulty,
                relevanceScore: 10 - index // Plus haut score pour les premiers cours
              });
            });

            if (courseRecommendations.length > 0) {
              console.log(`${courseRecommendations.length} cours extraits avec succès du texte`);
              recommendedCourses = courseRecommendations;
              // Sortir de la fonction catch puisque nous avons réussi à extraire des cours
              return;
            }
          }
        } catch (textExtractionError) {
          console.error("Erreur lors de l'extraction de cours à partir du texte:", textExtractionError);
        }

        // Si l'extraction de texte échoue également, utiliser les cours spécifiques à la catégorie
        console.log("Utilisation des cours spécifiques à la catégorie comme dernier recours");
        const categoryMapping = {
          "education": "education",
          "technology": "technology",
          "science": "science",
          "history": "history",
          "geography": "geography",
          "entertainment": "entertainment",
          "sports": "sports",
          "other": "general"
        };

        const englishCategory = categoryMapping[quizCategory] || quizCategory;
        recommendedCourses = getCategorySpecificCourses(englishCategory, recommendedDifficulty);
      }

      // Ajouter les URLs et images pour chaque cours et normaliser les valeurs
      const enhancedCourses = recommendedCourses.map(course => {
        // Trouver la plateforme correspondante
        const platform = platforms.find(p =>
          p.name.toLowerCase() === course.platform.toLowerCase()
        ) || platforms[0];

        // Construire l'URL de recherche
        const searchQuery = encodeURIComponent(`${course.title} ${quizCategory} course`);
        const searchUrl = `${platform.baseUrl}${searchQuery}`;

        // Normaliser la difficulté pour correspondre aux valeurs acceptées par le modèle
        let normalizedDifficulty = course.difficulty;

        // Mapper les valeurs possibles à celles acceptées par le modèle
        const difficultyMap = {
          'débutant': 'Débutant',
          'intermediaire': 'Intermédiaire',
          'intermédiaire': 'Intermédiaire',
          'intérmédiaire': 'Intermédiaire',
          'avancé': 'Avancé',
          'avance': 'Avancé',
          'expert': 'Expert'
        };

        // Normaliser en supprimant les accents et en mettant en minuscules pour la comparaison
        const normalizedKey = course.difficulty
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
          .toLowerCase();

        if (difficultyMap[normalizedKey]) {
          normalizedDifficulty = difficultyMap[normalizedKey];
        } else {
          // Si la valeur n'est pas reconnue, utiliser une valeur par défaut
          console.log(`Valeur de difficulté non reconnue: "${course.difficulty}", utilisation de la valeur par défaut "Intermédiaire"`);
          normalizedDifficulty = 'Intermédiaire';
        }

        return {
          ...course,
          url: searchUrl,
          imageUrl: platform.imageUrl,
          difficulty: normalizedDifficulty
        };
      });

      // Trier les cours par score de pertinence et prendre les 5 meilleurs
      const sortedCourses = enhancedCourses
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

      console.log(`${sortedCourses.length} cours recommandés générés avec succès`);

      // Créer la recommandation
      const recommendation = new CourseRecommendation({
        user: userId,
        quiz: quizId,
        quizAttempt: attemptId,
        recommendedCourses: sortedCourses,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: Math.round((attempt.score / attempt.maxScore) * 100),
        reason: "Basé sur votre performance au quiz et les questions que vous avez manquées, avec l'aide de l'IA GROQ"
      });

      const savedRecommendation = await recommendation.save();
      console.log("Course recommendations generated successfully with GROQ AI");
      return savedRecommendation;
    } catch (aiError) {
      console.error("Erreur lors de l'appel à l'API GROQ:", aiError);

      // En cas d'erreur, utiliser la méthode de fallback
      console.log("Utilisation de la méthode de fallback pour les recommandations...");

      // Extraire des mots-clés des questions incorrectes
      const extractedKeywords = [];
      incorrectAnswers.forEach(answer => {
        const questionText = answer.question.questionText.toLowerCase();

        // Extraire des mots-clés de la question (mots de plus de 3 lettres)
        const keywords = questionText.split(/\s+/)
          .filter(word => word.length > 3)
          .map(word => word.replace(/[.,;:!?()]/g, ''));

        extractedKeywords.push(...keywords);
      });

      // Obtenir des mots-clés uniques
      const uniqueKeywords = [...new Set(extractedKeywords)];

      // Obtenir la catégorie du quiz et la traduire en anglais pour la recherche
      const categoryMapping = {
        "education": "education",
        "technology": "technology",
        "science": "science",
        "history": "history",
        "geography": "geography",
        "entertainment": "entertainment",
        "sports": "sports",
        "other": "general"
      };

      const englishCategory = categoryMapping[quizCategory] || quizCategory;

      // Construire la requête de recherche
      const searchQuery = `${uniqueKeywords.slice(0, 3).join(" ")} ${englishCategory} course`;

      // Générer des cours pour chaque plateforme
      const onlineCourses = platforms.map(platform => {
        // Créer une URL de recherche
        const searchUrl = `${platform.baseUrl}${encodeURIComponent(searchQuery)}`;

        // Générer un titre basé sur les mots-clés et la catégorie
        const keywordTitle = uniqueKeywords.length > 0
          ? uniqueKeywords[Math.floor(Math.random() * uniqueKeywords.length)]
          : englishCategory;

        const title = generateCourseTitle(keywordTitle, englishCategory);

        // Générer une description
        const description = generateCourseDescription(keywordTitle, englishCategory, recommendedDifficulty);

        return {
          title,
          description,
          url: searchUrl,
          platform: platform.name,
          difficulty: recommendedDifficulty,
          relevanceScore: Math.random() * 5 + 5, // Score entre 5 et 10
          imageUrl: platform.imageUrl
        };
      });

      // Ajouter des cours spécifiques à la catégorie
      const categorySpecificCourses = getCategorySpecificCourses(englishCategory, recommendedDifficulty);
      onlineCourses.push(...categorySpecificCourses);

      // Trier les cours par score de pertinence et prendre les 5 meilleurs
      const sortedCourses = onlineCourses
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);

      const finalCourses = sortedCourses;

      // Créer la recommandation
      const recommendation = new CourseRecommendation({
        user: userId,
        quiz: quizId,
        quizAttempt: attemptId,
        recommendedCourses: finalCourses,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: Math.round((attempt.score / attempt.maxScore) * 100),
        reason: "Basé sur votre performance au quiz et les questions que vous avez manquées"
      });

      const savedRecommendation = await recommendation.save();
      console.log("Course recommendations generated successfully");
      return savedRecommendation;
    }
  } catch (error) {
    console.error("Error generating course recommendations:", error);
    return null;
  }
};

// Fonction pour générer un titre de cours basé sur un mot-clé et une catégorie
function generateCourseTitle(keyword, category) {
  const titleTemplates = [
    `Maîtrisez ${keyword} - Cours complet de ${category}`,
    `${keyword} pour les débutants: Guide complet`,
    `${category}: Apprenez ${keyword} de A à Z`,
    `Formation complète sur ${keyword} en ${category}`,
    `Les fondamentaux de ${keyword} - Cours de ${category}`,
    `${keyword} avancé: Techniques et pratiques en ${category}`,
    `${category} moderne: Tout sur ${keyword}`,
    `${keyword}: Cours intensif de ${category}`,
    `Devenez expert en ${keyword} - ${category} professionnel`,
    `${category} pratique: Maîtrisez ${keyword}`
  ];

  return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
}

// Fonction pour générer une description de cours
function generateCourseDescription(keyword, category, difficulty) {
  const difficultyDescriptions = {
    'Débutant': 'Ce cours est conçu pour les débutants et ne nécessite aucune connaissance préalable.',
    'Intermédiaire': 'Ce cours s\'adresse aux personnes ayant déjà des connaissances de base dans ce domaine.',
    'Avancé': 'Ce cours avancé est destiné aux personnes ayant déjà une bonne expérience dans ce domaine.',
    'Expert': 'Ce cours de niveau expert s\'adresse aux professionnels cherchant à perfectionner leurs compétences.'
  };

  const descriptionTemplates = [
    `Apprenez tout sur ${keyword} dans ce cours complet de ${category}. ${difficultyDescriptions[difficulty]} Vous acquerrez des compétences pratiques et théoriques qui vous permettront de progresser rapidement.`,
    `Ce cours de ${category} vous permettra de maîtriser ${keyword} comme un professionnel. ${difficultyDescriptions[difficulty]} Avec des exercices pratiques et des projets concrets, vous développerez une expertise solide.`,
    `Découvrez les secrets de ${keyword} dans ce cours intensif de ${category}. ${difficultyDescriptions[difficulty]} Notre approche pédagogique vous garantit une progression rapide et efficace.`,
    `Formation complète sur ${keyword} dans le domaine de ${category}. ${difficultyDescriptions[difficulty]} Vous apprendrez les meilleures pratiques et techniques utilisées par les experts du domaine.`,
    `Maîtrisez ${keyword} de A à Z avec ce cours de ${category}. ${difficultyDescriptions[difficulty]} Notre programme structuré vous guidera à travers toutes les étapes nécessaires pour devenir compétent.`
  ];

  return descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
}

// Fonction pour obtenir des cours spécifiques à une catégorie
function getCategorySpecificCourses(category, difficulty) {
  const categoryCoursesMap = {
    'education': [
      {
        title: 'Méthodes pédagogiques innovantes',
        description: 'Découvrez les approches pédagogiques modernes qui transforment l\'éducation. Ce cours vous présente des méthodes d\'enseignement efficaces adaptées aux besoins des apprenants d\'aujourd\'hui.',
        url: 'https://www.coursera.org/courses?query=innovative%20teaching%20methods',
        platform: 'Coursera',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      },
      {
        title: 'Technologies éducatives pour l\'enseignement',
        description: 'Apprenez à intégrer les technologies numériques dans votre enseignement pour améliorer l\'engagement et les résultats des élèves.',
        url: 'https://www.edx.org/search?q=educational%20technology',
        platform: 'edX',
        difficulty: 'Débutant',
        imageUrl: 'https://www.edx.org/images/logos/edx-logo-elm.svg'
      }
    ],
    'technology': [
      {
        title: 'Développement Web Full Stack',
        description: 'Maîtrisez le développement web front-end et back-end avec ce cours complet. Vous apprendrez HTML, CSS, JavaScript, ainsi que des frameworks modernes.',
        url: 'https://www.udemy.com/courses/search/?src=ukw&q=full%20stack%20web%20development',
        platform: 'Udemy',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg'
      },
      {
        title: 'Intelligence Artificielle: Principes et Applications',
        description: 'Découvrez les fondements de l\'intelligence artificielle et ses applications pratiques dans divers domaines.',
        url: 'https://www.coursera.org/courses?query=artificial%20intelligence',
        platform: 'Coursera',
        difficulty: 'Avancé',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ],
    'science': [
      {
        title: 'Introduction à la Biologie Moléculaire',
        description: 'Ce cours vous présente les principes fondamentaux de la biologie moléculaire, de l\'ADN aux protéines.',
        url: 'https://www.edx.org/search?q=molecular%20biology',
        platform: 'edX',
        difficulty: 'Débutant',
        imageUrl: 'https://www.edx.org/images/logos/edx-logo-elm.svg'
      },
      {
        title: 'Physique Quantique pour Tous',
        description: 'Découvrez les principes fascinants de la physique quantique expliqués de manière accessible.',
        url: 'https://www.khanacademy.org/search?page_search_query=quantum%20physics',
        platform: 'Khan Academy',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png'
      }
    ],
    'history': [
      {
        title: 'Histoire des Civilisations Anciennes',
        description: 'Explorez les grandes civilisations de l\'Antiquité: Égypte, Mésopotamie, Grèce et Rome.',
        url: 'https://www.futurelearn.com/search?q=ancient%20civilizations',
        platform: 'FutureLearn',
        difficulty: 'Débutant',
        imageUrl: 'https://www.futurelearn.com/assets/fl-logo.svg'
      },
      {
        title: 'Guerres Mondiales: Causes et Conséquences',
        description: 'Analysez en profondeur les causes, le déroulement et les conséquences des deux guerres mondiales qui ont façonné notre monde moderne.',
        url: 'https://www.coursera.org/courses?query=world%20wars',
        platform: 'Coursera',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ],
    'geography': [
      {
        title: 'Géographie Humaine et Culturelle',
        description: 'Découvrez comment les sociétés humaines interagissent avec leur environnement et créent des paysages culturels distincts.',
        url: 'https://www.edx.org/search?q=human%20geography',
        platform: 'edX',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://www.edx.org/images/logos/edx-logo-elm.svg'
      },
      {
        title: 'Systèmes d\'Information Géographique (SIG)',
        description: 'Apprenez à utiliser les outils SIG pour analyser et visualiser des données spatiales.',
        url: 'https://www.coursera.org/courses?query=gis',
        platform: 'Coursera',
        difficulty: 'Avancé',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ],
    'entertainment': [
      {
        title: 'Production Cinématographique pour Débutants',
        description: 'Apprenez les bases de la réalisation de films, du scénario au montage final.',
        url: 'https://www.udemy.com/courses/search/?src=ukw&q=filmmaking%20beginners',
        platform: 'Udemy',
        difficulty: 'Débutant',
        imageUrl: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg'
      },
      {
        title: 'Histoire de la Musique Moderne',
        description: 'Explorez l\'évolution de la musique du 20e siècle à nos jours, à travers ses genres et artistes majeurs.',
        url: 'https://www.coursera.org/courses?query=music%20history',
        platform: 'Coursera',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ],
    'sports': [
      {
        title: 'Nutrition Sportive et Performance',
        description: 'Découvrez comment optimiser votre alimentation pour améliorer vos performances sportives et votre récupération.',
        url: 'https://www.edx.org/search?q=sports%20nutrition',
        platform: 'edX',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://www.edx.org/images/logos/edx-logo-elm.svg'
      },
      {
        title: 'Psychologie du Sport',
        description: 'Apprenez les techniques mentales utilisées par les athlètes d\'élite pour maximiser leurs performances.',
        url: 'https://www.coursera.org/courses?query=sports%20psychology',
        platform: 'Coursera',
        difficulty: 'Avancé',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ],
    'general': [
      {
        title: 'Développement Personnel et Productivité',
        description: 'Découvrez des techniques efficaces pour améliorer votre productivité et atteindre vos objectifs personnels.',
        url: 'https://www.udemy.com/courses/search/?src=ukw&q=personal%20development%20productivity',
        platform: 'Udemy',
        difficulty: 'Débutant',
        imageUrl: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg'
      },
      {
        title: 'Communication Efficace',
        description: 'Améliorez vos compétences en communication pour réussir dans votre vie professionnelle et personnelle.',
        url: 'https://www.coursera.org/courses?query=effective%20communication',
        platform: 'Coursera',
        difficulty: 'Intermédiaire',
        imageUrl: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png'
      }
    ]
  };

  // Récupérer les cours spécifiques à la catégorie ou utiliser la catégorie générale si non trouvée
  const categoryCourses = categoryCoursesMap[category] || categoryCoursesMap['general'];

  // Filtrer par niveau de difficulté si possible, sinon retourner tous les cours
  const filteredCourses = categoryCourses.filter(course =>
    course.difficulty === difficulty || categoryCourses.length <= 2
  );

  // Si aucun cours ne correspond au niveau de difficulté, retourner tous les cours
  return filteredCourses.length > 0 ? filteredCourses : categoryCourses;
}

// Get recommendations for a specific quiz attempt
exports.getRecommendationsForAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const recommendations = await CourseRecommendation.findOne({ quizAttempt: attemptId });

    if (!recommendations) {
      return res.status(404).json({ message: "No recommendations found for this attempt" });
    }

    // Populate the quiz information
    await recommendations.populate("quiz", "title category");

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error retrieving recommendations:", error);
    res.status(500).json({ message: "Error retrieving recommendations", error: error.message });
  }
};

// Get all recommendations for a user
exports.getUserRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const recommendations = await CourseRecommendation.find({ user: userId })
      .populate("quiz", "title category")
      .sort({ createdAt: -1 });

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error retrieving user recommendations:", error);
    res.status(500).json({ message: "Error retrieving user recommendations", error: error.message });
  }
};
