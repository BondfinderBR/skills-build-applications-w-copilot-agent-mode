import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

type ServiceError = Error & { status: number };

function serviceError(message: string, status: number): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError('Activity details are required', 400);
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)
    || typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw serviceError('Valid userId and teamId are required', 400);
  }
  if (typeof type !== 'string' || !type.trim()
    || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw serviceError('Activity type and positive minutes are required', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw serviceError('The selected user or team does not exist', 404);
  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError('Team details are required', 400);
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw serviceError('Team name is required', 400);
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError('Team mascot is required', 400);
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw serviceError('Team members must be valid user IDs', 400);
  }

  const users = members.length ? await User.find({ _id: { $in: members } }) : [];
  if (users.length !== members.length) throw serviceError('One or more team members do not exist', 404);
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: users.map((user) => user._id) });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw serviceError('User not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const workoutFocuses = new Set(workouts.map((workout) => workout.focus.toLowerCase()));
  const goalFocus = user.fitnessGoal?.toLowerCase();
  const activityFocuses = activities
    .map((activity) => activity.type.toLowerCase())
    .map((type) => (type === 'run' || type === 'cycle' || type === 'walk' ? 'endurance' : type));
  const activityFocus = activityFocuses.find((focus) => workoutFocuses.has(focus));
  const preferredFocus = goalFocus && workoutFocuses.has(goalFocus) ? goalFocus : activityFocus;
  return workouts
    .map((workout) => {
      const matchesGoal = workout.focus.toLowerCase() === preferredFocus && preferredFocus === goalFocus;
      const matchesActivity = activityFocuses.includes(workout.focus.toLowerCase());
      const reason = matchesActivity
        ? 'This workout matches your recent activity pattern.'
        : matchesGoal
          ? 'This workout supports your personal fitness goal.'
          : 'This workout can complement your training routine.';
      return { ...workout, reason, match: workout.focus.toLowerCase() === preferredFocus };
    })
    .sort((left, right) => Number(right.match) - Number(left.match) || left.title.localeCompare(right.title))
    .map(({ match: _match, ...workout }) => workout);
}

export { User };
