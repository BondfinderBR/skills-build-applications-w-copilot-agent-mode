import { useApiData } from '../api/useApiData.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const { data, error, loading } = useApiData<TeamsResponse>('/api/teams');
  return <section className="card"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {loading && <p role="status">Loading teams...</p>}
    {error && <p role="alert">Unable to load teams: {error}</p>}
    {data && data.teams.length === 0 && <p>No teams yet.</p>}
    {data && data.teams.length > 0 && <ul>{data.teams.map((team) => (
      <li key={team.name}>{team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members</li>
    ))}</ul>}
  </div></section>;
}
