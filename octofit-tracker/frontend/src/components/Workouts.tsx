import { useApiData } from '../api/useApiData.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const email = 'mona@example.com';
  const { data, error, loading } = useApiData<WorkoutsResponse>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
  return <section className="card"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
    {data && data.suggestions.length === 0 && <p>No workout suggestions available.</p>}
    {data && data.suggestions.length > 0 && <ul>{data.suggestions.map((workout) => (
      <li key={workout.title}>
        <strong>{workout.title}</strong>
        {workout.focus && ` — ${workout.focus}`}
        {workout.minutes && `, ${workout.minutes} minutes`}
        {workout.reason && <p>{workout.reason}</p>}
      </li>
    ))}</ul>}
  </div></section>;
}
