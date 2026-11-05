import styles from './GoalCelebration.module.css';

import type { CSSProperties } from 'react';

import type { LiveGoal } from '@/lib/live/types';

type Score = { red: number; blue: number };

export interface GoalCelebrationData {
  team: 1 | 2;
  before: Score;
  after: Score;
  attribution?: LiveGoal;
}

function ScoreNumber({ before, after }: { before: number; after: number }) {
  return (
    <span className={styles.number} style={{ minWidth: `${Math.max(String(before).length, String(after).length)}ch` }}>
      {before === after ? (
        after
      ) : (
        <>
          <span className={styles.previous}>{before}</span>
          <span className={styles.current}>{after}</span>
        </>
      )}
    </span>
  );
}

export default function GoalCelebration({ team, before, after, attribution }: GoalCelebrationData) {
  const name = team === 1 ? 'Red' : 'Blue';
  const credit = attribution
    ? `${attribution.ownGoal ? 'Own goal' : 'Goal'} by ${attribution.scorer?.name ?? 'unknown player'}${attribution.assistant ? `. Assist by ${attribution.assistant.name}` : ''}`
    : '';
  return (
    <div className={styles.celebration} style={{ '--goal-color': team === 1 ? '#e66e55' : '#5a89e5' } as CSSProperties}>
      <div
        className={styles.banner}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${name} team scores! Red ${after.red}, Blue ${after.blue}. ${credit}`}
      >
        <span className={styles.team} aria-hidden="true">
          GOAL! · {name} team scores
        </span>
        <div className={styles.score} aria-hidden="true">
          <span className={styles.red}>
            <ScoreNumber before={before.red} after={after.red} />
          </span>
          <span className={styles.separator}>:</span>
          <span className={styles.blue}>
            <ScoreNumber before={before.blue} after={after.blue} />
          </span>
        </div>
        {attribution && (
          <div className={styles.credits} aria-hidden="true">
            <div className={styles.credit}>
              <span className={styles.creditLabel}>{attribution.ownGoal ? 'Own goal' : 'Goal'}</span>
              <span className={styles.player} title={attribution.scorer?.name}>
                {attribution.scorer?.name ?? 'Scorer unavailable'}
              </span>
            </div>
            {!attribution.ownGoal && attribution.assistant && (
              <div className={styles.credit}>
                <span className={styles.creditLabel}>Assist</span>
                <span className={styles.player} title={attribution.assistant.name}>
                  {attribution.assistant.name}
                </span>
              </div>
            )}
          </div>
        )}
        <span className={styles.rule} aria-hidden="true" />
      </div>
    </div>
  );
}
