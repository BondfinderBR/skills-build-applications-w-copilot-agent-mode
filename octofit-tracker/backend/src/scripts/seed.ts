import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

const fixtureKeys = {
  teams: { octocats: 'Octocats', robocats: 'Robocats' },
  users: { mona: 'mona@example.com', hubot: 'hubot@example.com' },
  workouts: { intervals: 'Intervals', strength: 'Strength Circuit' },
  activities: {
    monaRun: new Date('2026-01-10T12:00:00.000Z'),
    hubotCycle: new Date('2026-01-11T12:00:00.000Z'),
  },
};

// Seed stable demo records without clearing data owned by the application.
async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await Team.findOneAndUpdate(
      { name: fixtureKeys.teams.octocats },
      { $set: { name: fixtureKeys.teams.octocats, mascot: 'Mona' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const robocats = await Team.findOneAndUpdate(
      { name: fixtureKeys.teams.robocats },
      { $set: { name: fixtureKeys.teams.robocats, mascot: 'Hubot' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const mona = await upsertDemoUser('Mona', fixtureKeys.users.mona, octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', fixtureKeys.users.hubot, robocats._id, 'strength');

    await Activity.updateOne(
      { user: mona._id, team: octocats._id, type: 'run', occurredAt: fixtureKeys.activities.monaRun },
      { $set: { user: mona._id, team: octocats._id, type: 'run', minutes: 40, points: 40, occurredAt: fixtureKeys.activities.monaRun } },
      { upsert: true },
    );
    await Activity.updateOne(
      { user: hubot._id, team: robocats._id, type: 'cycle', occurredAt: fixtureKeys.activities.hubotCycle },
      { $set: { user: hubot._id, team: robocats._id, type: 'cycle', minutes: 25, points: 25, occurredAt: fixtureKeys.activities.hubotCycle } },
      { upsert: true },
    );
    await Workout.updateOne(
      { title: fixtureKeys.workouts.intervals },
      { $set: { title: fixtureKeys.workouts.intervals, focus: 'endurance', minutes: 30, difficulty: 'moderate' } },
      { upsert: true },
    );
    await Workout.updateOne(
      { title: fixtureKeys.workouts.strength },
      { $set: { title: fixtureKeys.workouts.strength, focus: 'strength', minutes: 30, difficulty: 'moderate' } },
      { upsert: true },
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
