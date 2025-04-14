import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toastManager } from '../ui/toast/ToastContainer';
import Button from '../ui/button/Button';
import { Textarea } from '../ui/form/textarea';

// Types
interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
}

interface Comment {
  _id: string;
  content: string;
  project: string;
  author: User;
  mentions: User[];
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  projectId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ projectId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Récupérer les commentaires du projet
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/comments/project/${projectId}`);
        setComments(response.data);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des commentaires:", err);
        setError("Erreur lors de la récupération des commentaires");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [projectId]);

  // Récupérer tous les utilisateurs pour les suggestions de mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/showuser');
        setUsers(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs:", err);
      }
    };

    fetchUsers();
  }, []);

  // Gérer les suggestions d'utilisateurs lors de la saisie @
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Récupérer la position du curseur
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    // Vérifier si nous sommes en train de taper une mention (@)
    const textBeforeCursor = value.substring(0, cursorPos);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (atSymbolIndex !== -1 && !textBeforeCursor.substring(atSymbolIndex + 1).includes(' ')) {
      const query = textBeforeCursor.substring(atSymbolIndex + 1);

      // Filtrer les utilisateurs en fonction de la requête
      const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase())
      );

      setUserSuggestions(filteredUsers);
      setShowUserSuggestions(true);
    } else {
      setShowUserSuggestions(false);
    }
  };

  // Insérer une mention d'utilisateur
  const insertMention = (username: string) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (atSymbolIndex !== -1) {
      const textBeforeMention = newComment.substring(0, atSymbolIndex);
      const textAfterCursor = newComment.substring(cursorPosition);

      const newText = `${textBeforeMention}@${username} ${textAfterCursor}`;
      setNewComment(newText);

      // Mettre à jour la position du curseur après l'insertion
      const newCursorPos = atSymbolIndex + username.length + 2; // +2 pour @ et espace
      setCursorPosition(newCursorPos);

      // Mettre le focus sur le textarea et positionner le curseur
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }

    setShowUserSuggestions(false);
  };

  // Ajouter un nouveau commentaire
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      setLoading(true);

      // Récupérer l'ID de l'utilisateur depuis localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Vous devez être connecté pour ajouter un commentaire");
        return;
      }

      // Décoder le token pour obtenir l'ID utilisateur
      interface DecodedToken {
        user?: {
          id: string;
        };
        id?: string;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.user?.id || decodedToken.id;

      if (!userId) {
        setError("Impossible d'identifier l'utilisateur");
        return;
      }

      const response = await axios.post('http://localhost:8000/comments', {
        content: newComment,
        projectId,
        userId
      });

      // Ajouter le nouveau commentaire à la liste
      setComments([response.data.comment, ...comments]);
      setNewComment('');

      toastManager.addToast(
        "Commentaire ajouté avec succès",
        "success",
        5000
      );
    } catch (err: any) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      setError("Erreur lors de l'ajout du commentaire");
      toastManager.addToast(
        "Erreur lors de l'ajout du commentaire",
        "error",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Commencer l'édition d'un commentaire
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  // Annuler l'édition d'un commentaire
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  // Mettre à jour un commentaire
  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setLoading(true);

      // Récupérer l'ID de l'utilisateur depuis localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Vous devez être connecté pour modifier un commentaire");
        return;
      }

      // Décoder le token pour obtenir l'ID utilisateur
      interface DecodedToken {
        user?: {
          id: string;
        };
        id?: string;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.user?.id || decodedToken.id;

      if (!userId) {
        setError("Impossible d'identifier l'utilisateur");
        return;
      }

      const response = await axios.put(`http://localhost:8000/comments/${commentId}`, {
        content: editContent,
        userId
      });

      // Mettre à jour le commentaire dans la liste
      setComments(comments.map(comment =>
        comment._id === commentId ? response.data.comment : comment
      ));

      setEditingCommentId(null);
      setEditContent('');

      toastManager.addToast(
        "Commentaire mis à jour avec succès",
        "success",
        5000
      );
    } catch (err: any) {
      console.error("Erreur lors de la modification du commentaire:", err);
      setError("Erreur lors de la modification du commentaire");
      toastManager.addToast(
        "Erreur lors de la modification du commentaire",
        "error",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un commentaire
  const deleteComment = async (commentId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    try {
      setLoading(true);

      // Récupérer l'ID de l'utilisateur depuis localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Vous devez être connecté pour supprimer un commentaire");
        return;
      }

      // Décoder le token pour obtenir l'ID utilisateur
      interface DecodedToken {
        user?: {
          id: string;
        };
        id?: string;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.user?.id || decodedToken.id;

      if (!userId) {
        setError("Impossible d'identifier l'utilisateur");
        return;
      }

      await axios.delete(`http://localhost:8000/comments/${commentId}`, {
        data: { userId }
      });

      // Supprimer le commentaire de la liste
      setComments(comments.filter(comment => comment._id !== commentId));

      toastManager.addToast(
        "Commentaire supprimé avec succès",
        "success",
        5000
      );
    } catch (err: any) {
      console.error("Erreur lors de la suppression du commentaire:", err);
      setError("Erreur lors de la suppression du commentaire");
      toastManager.addToast(
        "Erreur lors de la suppression du commentaire",
        "error",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Formater le contenu du commentaire pour mettre en évidence les mentions
  const formatCommentContent = (content: string) => {
    // Remplacer les mentions @username par des spans stylisés
    return content.replace(/@(\w+)/g, '<span class="text-blue-500 font-semibold">@$1</span>');
  };

  // Vérifier si l'utilisateur actuel est l'auteur du commentaire
  const isCommentAuthor = (comment: Comment) => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      // Décoder le token pour obtenir l'ID utilisateur
      interface DecodedToken {
        user?: {
          id: string;
        };
        id?: string;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.user?.id || decodedToken.id;

      if (!userId) return false;

      return comment.author._id === userId;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'auteur du commentaire:", error);
      return false;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Commentaires</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulaire d'ajout de commentaire */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Ajouter un commentaire... Utilisez @ pour mentionner un utilisateur"
            value={newComment}
            onChange={handleCommentChange}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />

          {/* Suggestions d'utilisateurs */}
          {showUserSuggestions && userSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {userSuggestions.map(user => (
                <div
                  key={user._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => insertMention(user.username)}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full mr-2" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user.username}</span>
                  {user.firstName && user.lastName && (
                    <span className="text-gray-500 text-sm ml-2">({user.firstName} {user.lastName})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={addComment}
            disabled={loading || !newComment.trim()}
          >
            {loading ? "Envoi en cours..." : "Ajouter un commentaire"}
          </Button>
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500">Aucun commentaire pour le moment.</p>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {comment.author.avatarUrl ? (
                    <img
                      src={comment.author.avatarUrl}
                      alt={comment.author.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold">{comment.author.username}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                      {comment.createdAt !== comment.updatedAt && " (modifié)"}
                    </p>
                  </div>
                </div>

                {isCommentAuthor(comment) && (
                  <div className="flex space-x-2">
                    {editingCommentId !== comment._id ? (
                      <>
                        <button
                          onClick={() => startEditComment(comment)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteComment(comment._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={cancelEditComment}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingCommentId === comment._id ? (
                <div className="mt-3 space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={cancelEditComment}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => updateComment(comment._id)}
                      disabled={loading || !editContent.trim()}
                    >
                      {loading ? "Mise à jour..." : "Mettre à jour"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-3 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
                />
              )}

              {comment.mentions.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  <span>Mentions: </span>
                  {comment.mentions.map((user, index) => (
                    <span key={user._id} className="text-blue-500">
                      @{user.username}
                      {index < comment.mentions.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;

