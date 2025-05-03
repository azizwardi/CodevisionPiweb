import React from 'react';
import SharedCalendar from '../../shared/components/SharedCalendar';

const TeamLeaderCalendar: React.FC = () => {
  return (
    <SharedCalendar 
      title="Calendrier d'équipe" 
      description="Gérez les événements et les échéances de votre équipe"
    />
  );
};

export default TeamLeaderCalendar;
