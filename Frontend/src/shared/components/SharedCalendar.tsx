import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../../dashboard/components/ui/modal";
import { useModal } from "../../dashboard/hooks/useModal";
import PageMeta from "../../dashboard/components/common/PageMeta";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

interface ValidationErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  calendar?: string;
  formError?: string;
}

interface SharedCalendarProps {
  title?: string;
  description?: string;
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({
  title = "Calendrier",
  description = "Calendrier des événements"
}) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Vérifier le rôle de l'utilisateur
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  // Fonction pour charger les événements depuis l'API
  const fetchEvents = async () => {
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get("http://localhost:5000/events", { headers });
      console.log("Événements récupérés:", response.data);

      // Transformer les données pour FullCalendar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedEvents = response.data.map((event: any) => ({
        id: event._id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        extendedProps: { calendar: event.calendar },
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Erreur lors du chargement des événements",
        type: "error"
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    openModal();
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${eventTitle}" ?`)) {
      return;
    }

    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`http://localhost:5000/events/${selectedEvent.id}`, { headers });
      toastManager.addToast({
        title: "Succès",
        description: "Événement supprimé avec succès",
        type: "success"
      });
      fetchEvents();
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'événement",
        type: "error"
      });
    }
  };

  // Fonction de validation du formulaire
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du titre
    if (!eventTitle.trim()) {
      errors.title = "Le titre de l'événement est requis";
      isValid = false;
    } else if (eventTitle.length < 3) {
      errors.title = "Le titre doit contenir au moins 3 caractères";
      isValid = false;
    } else if (eventTitle.length > 100) {
      errors.title = "Le titre ne doit pas dépasser 100 caractères";
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()[\]{}#@!?]+$/.test(eventTitle)) {
      // Permet les lettres, chiffres, espaces, accents, tirets, underscores, points, virgules, parenthèses, crochets, accolades, dièse, arobase, point d'exclamation et point d'interrogation
      errors.title = "Le titre contient des caractères non autorisés";
      isValid = false;
    }

    // Validation de la date de début
    if (!eventStartDate) {
      errors.startDate = "La date de début est requise";
      isValid = false;
    } else {
      // Vérifier que la date n'est pas dans le passé (avant aujourd'hui)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit
      const startDate = new Date(eventStartDate);

      if (startDate < today) {
        errors.startDate = "La date de début ne peut pas être dans le passé";
        isValid = false;
      }
    }

    // Validation de la date de fin
    if (eventEndDate) {
      const startDate = new Date(eventStartDate);
      const endDate = new Date(eventEndDate);

      if (endDate < startDate) {
        errors.endDate = "La date de fin doit être postérieure à la date de début";
        isValid = false;
      }
    }

    // Validation de la couleur de l'événement
    if (!eventLevel) {
      errors.calendar = "Veuillez sélectionner une couleur pour l'événement";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Fonction pour gérer les changements de titre avec validation en temps réel
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventTitle(value);

    // Validation en temps réel
    const errors = { ...validationErrors };
    delete errors.title;

    if (value.length > 0 && value.length < 3) {
      errors.title = "Le titre doit contenir au moins 3 caractères";
    } else if (value.length > 100) {
      errors.title = "Le titre ne doit pas dépasser 100 caractères";
    } else if (value.length > 0 && !/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()[\]{}#@!?]+$/.test(value)) {
      errors.title = "Le titre contient des caractères non autorisés";
    }

    setValidationErrors(errors);
  };

  // Fonction pour gérer les changements de date de début avec validation en temps réel
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventStartDate(value);

    // Validation en temps réel
    const errors = { ...validationErrors };
    delete errors.startDate;
    delete errors.endDate; // Réinitialiser aussi l'erreur de date de fin car elle dépend de la date de début

    if (value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit
      const startDate = new Date(value);

      if (startDate < today) {
        errors.startDate = "La date de début ne peut pas être dans le passé";
      }

      // Vérifier aussi la date de fin si elle existe
      if (eventEndDate) {
        const endDate = new Date(eventEndDate);
        if (endDate < startDate) {
          errors.endDate = "La date de fin doit être postérieure à la date de début";
        }
      }
    }

    setValidationErrors(errors);
  };

  // Fonction pour gérer les changements de date de fin avec validation en temps réel
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventEndDate(value);

    // Validation en temps réel
    const errors = { ...validationErrors };
    delete errors.endDate;

    if (value && eventStartDate) {
      const startDate = new Date(eventStartDate);
      const endDate = new Date(value);

      if (endDate < startDate) {
        errors.endDate = "La date de fin doit être postérieure à la date de début";
      }
    }

    setValidationErrors(errors);
  };

  const handleAddOrUpdateEvent = async () => {
    try {
      // Valider le formulaire
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      // Récupérer le token d'authentification
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (selectedEvent) {
        // Mettre à jour un événement existant
        console.log("Mise à jour de l'événement:", selectedEvent.id);

        await axios.put(`http://localhost:5000/events/${selectedEvent.id}`, {
          title: eventTitle,
          start: eventStartDate,
          end: eventEndDate || eventStartDate,
          allDay: true,
          calendar: eventLevel || "Primary", // Utiliser Primary comme valeur par défaut
        }, { headers });

        toastManager.addToast({
          title: "Succès",
          description: "Événement mis à jour avec succès",
          type: "success"
        });
      } else {
        // Ajouter un nouvel événement
        console.log("Création d'un nouvel événement");

        await axios.post("http://localhost:5000/events", {
          title: eventTitle,
          start: eventStartDate,
          end: eventEndDate || eventStartDate,
          allDay: true,
          calendar: eventLevel || "Primary", // Utiliser Primary comme valeur par défaut
        }, { headers });

        toastManager.addToast({
          title: "Succès",
          description: "Événement créé avec succès",
          type: "success"
        });
      }

      // Recharger les événements
      fetchEvents();
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification de l'événement:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de l'événement",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
    setValidationErrors({});
  };

  return (
    <>
      <PageMeta
        title={`${title} | CodevisionPiweb`}
        description={description}
      />
      <PageBreadcrumb pageTitle={title} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Modifier l'événement" : "Ajouter un événement"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Planifiez votre prochain événement important
              </p>
            </div>

            {validationErrors.formError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{validationErrors.formError}</p>
              </div>
            )}
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Titre de l'événement
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={handleTitleChange}
                    placeholder="Entrez le titre de l'événement"
                    className={`dark:bg-dark-900 h-11 w-full rounded-lg border ${validationErrors.title ? 'border-red-500' : 'border-gray-300'} bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
                    required
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
                  )}
                  {!validationErrors.title && (
                    <p className="mt-1 text-xs text-gray-500">{eventTitle.length}/100 caractères</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Couleur de l'événement
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span className="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Date de début
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={handleStartDateChange}
                    min={new Date().toISOString().split('T')[0]} // Empêche de sélectionner des dates passées
                    className={`dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300'} bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
                    required
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.startDate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">La date de début doit être aujourd'hui ou une date future</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Date de fin
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={handleEndDateChange}
                    min={eventStartDate || new Date().toISOString().split('T')[0]} // Empêche de sélectionner des dates antérieures à la date de début
                    className={`dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300'} bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
                  />
                  {validationErrors.endDate && (
                    <p className="mt-1 text-sm text-red-500">{validationErrors.endDate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">La date de fin doit être postérieure à la date de début</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Fermer
              </button>
              {selectedEvent && (
                <button
                  onClick={handleDeleteEvent}
                  type="button"
                  className="flex w-full justify-center rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-700 hover:bg-error-50 dark:border-error-700 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                disabled={loading}
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed sm:w-auto"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {selectedEvent ? "Mise à jour..." : "Ajout..."}
                  </span>
                ) : (
                  selectedEvent ? "Mettre à jour" : "Ajouter"
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default SharedCalendar;
