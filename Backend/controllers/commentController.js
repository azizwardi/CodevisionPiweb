const Comment = require("../models/comment");
const User = require("../models/user");
const Project = require("../models/project");

// Fonction utilitaire pour extraire les mentions (@username) du contenu
const extractMentions = async (content) => {
  // Regex pour trouver les mentions @username
  const mentionRegex = /@(\w+)/g;
  const mentionMatches = content.match(mentionRegex) || [];
  
  // Extraire les noms d'utilisateur sans le @
  const usernames = mentionMatches.map(mention => mention.substring(1));
  
  if (usernames.length === 0) {
    return [];
  }
  
  // Trouver les utilisateurs correspondants dans la base de données
  const mentionedUsers = await User.find({ username: { $in: usernames } }).select('_id');
  return mentionedUsers.map(user => user._id);
};

// Créer un commentaire
exports.createComment = async (req, res) => {
  try {
    const { content, projectId } = req.body;
    const userId = req.user ? req.user._id : req.body.userId; // Utiliser l'ID de l'utilisateur authentifié ou celui fourni dans la requête
    
    // Vérifier si le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    
    // Extraire les mentions du contenu
    const mentions = await extractMentions(content);
    
    // Créer le commentaire
    const comment = new Comment({
      content,
      project: projectId,
      author: userId,
      mentions,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await comment.save();
    
    // Récupérer le commentaire avec les références peuplées
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username firstName lastName email avatarUrl')
      .populate('mentions', 'username firstName lastName email');
    
    // Envoyer des notifications aux utilisateurs mentionnés
    if (mentions.length > 0 && global.io) {
      const authorUser = await User.findById(userId).select('username');
      const authorName = authorUser ? authorUser.username : 'Un utilisateur';
      
      mentions.forEach(async (mentionId) => {
        const notification = {
          type: 'mention_notification',
          projectId,
          projectName: project.name,
          commentId: comment._id,
          authorId: userId,
          authorName,
          targetUserId: mentionId,
          forUserId: mentionId,
          message: `${authorName} vous a mentionné dans un commentaire sur le projet "${project.name}"`,
          timestamp: new Date().toISOString(),
          realtime: true
        };
        
        // Envoyer la notification à l'utilisateur mentionné
        global.io.to(`user_${mentionId}`).emit('memberAdded', notification);
        
        // Envoyer également en broadcast pour s'assurer que la notification est reçue
        global.io.emit('memberAdded', notification);
        
        console.log(`Notification de mention envoyée à l'utilisateur ${mentionId}`);
      });
    }
    
    res.status(201).json({
      message: "Commentaire créé avec succès",
      comment: populatedComment
    });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    res.status(500).json({
      message: "Erreur lors de la création du commentaire",
      error: error.message
    });
  }
};

// Récupérer tous les commentaires d'un projet
exports.getProjectComments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Vérifier si le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    
    // Récupérer les commentaires du projet
    const comments = await Comment.find({ project: projectId })
      .populate('author', 'username firstName lastName email avatarUrl')
      .populate('mentions', 'username firstName lastName email')
      .sort({ createdAt: -1 }); // Tri par date de création décroissante
    
    res.status(200).json(comments);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des commentaires",
      error: error.message
    });
  }
};

// Mettre à jour un commentaire
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user ? req.user._id : req.body.userId;
    
    // Vérifier si le commentaire existe
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }
    
    // Vérifier si l'utilisateur est l'auteur du commentaire
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce commentaire" });
    }
    
    // Extraire les nouvelles mentions
    const newMentions = await extractMentions(content);
    
    // Mettre à jour le commentaire
    comment.content = content;
    comment.mentions = newMentions;
    comment.updatedAt = new Date();
    
    await comment.save();
    
    // Récupérer le commentaire mis à jour avec les références peuplées
    const updatedComment = await Comment.findById(commentId)
      .populate('author', 'username firstName lastName email avatarUrl')
      .populate('mentions', 'username firstName lastName email');
    
    // Envoyer des notifications pour les nouvelles mentions
    if (newMentions.length > 0 && global.io) {
      const project = await Project.findById(comment.project);
      const authorUser = await User.findById(userId).select('username');
      const authorName = authorUser ? authorUser.username : 'Un utilisateur';
      
      // Trouver les nouvelles mentions (celles qui n'étaient pas dans le commentaire original)
      const oldMentionIds = comment.mentions.map(m => m.toString());
      const newMentionIds = newMentions.filter(m => !oldMentionIds.includes(m.toString()));
      
      newMentionIds.forEach(async (mentionId) => {
        const notification = {
          type: 'mention_notification',
          projectId: comment.project,
          projectName: project.name,
          commentId: comment._id,
          authorId: userId,
          authorName,
          targetUserId: mentionId,
          forUserId: mentionId,
          message: `${authorName} vous a mentionné dans un commentaire modifié sur le projet "${project.name}"`,
          timestamp: new Date().toISOString(),
          realtime: true
        };
        
        // Envoyer la notification à l'utilisateur mentionné
        global.io.to(`user_${mentionId}`).emit('memberAdded', notification);
        
        // Envoyer également en broadcast pour s'assurer que la notification est reçue
        global.io.emit('memberAdded', notification);
        
        console.log(`Notification de mention envoyée à l'utilisateur ${mentionId}`);
      });
    }
    
    res.status(200).json({
      message: "Commentaire mis à jour avec succès",
      comment: updatedComment
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du commentaire:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du commentaire",
      error: error.message
    });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user ? req.user._id : req.body.userId;
    
    // Vérifier si le commentaire existe
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }
    
    // Vérifier si l'utilisateur est l'auteur du commentaire
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce commentaire" });
    }
    
    // Supprimer le commentaire
    await Comment.findByIdAndDelete(commentId);
    
    res.status(200).json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression du commentaire",
      error: error.message
    });
  }
};
