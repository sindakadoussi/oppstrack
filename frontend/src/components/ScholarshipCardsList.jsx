// components/ScholarshipCardsList.jsx
import React from 'react';
import BourseCard from './BourseCard';

export default function ScholarshipCardsList({ 
  scholarships, 
  user, 
  onAskAI, 
  onCardClick, 
  onStar, 
  onApply,
  starredIds = [],
  appliedIds = []
}) {
  if (!scholarships?.length) return null;

  return (
    <div className="scholarship-cards-list">
      {scholarships.map((bourse, index) => (
        <div key={bourse.id || index} className="scholarship-card-wrapper">
          <BourseCard
            bourse={bourse}
            user={user}
            onAskAI={onAskAI}
            onClick={() => onCardClick?.(bourse)}
            starred={starredIds.includes(bourse.id)}
            onStar={onStar}
            applied={appliedIds.includes(bourse.id)}
            onApply={onApply}
          />
        </div>
      ))}
      <div className="cards-footer">
        <span className="cards-count">{scholarships.length} bourse{scholarships.length > 1 ? 's' : ''} recommandée{scholarships.length > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}