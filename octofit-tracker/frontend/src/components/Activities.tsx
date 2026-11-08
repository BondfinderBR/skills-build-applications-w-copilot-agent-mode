import { useApiData } from '../api/useApiData.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const { data, error, loading } = useApiData<ActivitiesResponse>('/api/activities');
  return <section className="card"><div className="card-body">
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {loading && <p role="status">Loading activities...</p>}
    {error && <p role="alert">Unable to load activities: {error}</p>}
    {data && data.activities.length === 0 && <p>No activities yet.</p>}
    {data && data.activities.length > 0 && <ul>{data.activities.map((activity, index) => (
      <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>
    ))}</ul>}
  </div></section>;
}
