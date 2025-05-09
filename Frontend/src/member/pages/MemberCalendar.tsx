import React from 'react';
import SharedCalendar from '../../shared/components/SharedCalendar';

const MemberCalendar: React.FC = () => {
  return (
    <SharedCalendar 
      title="Mon Calendrier" 
      description="Gérez vos événements et échéances"
    />
  );
};

export default MemberCalendar;
