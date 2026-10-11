import type {
  Activity,
  Difficulty,
  Environment,
  Mission,
  MissionPrefs,
  TimeOption,
} from "../types";
import { makeId } from "./id";

interface FallbackTemplate {
  title: string;
  description: string;
  activity: Activity | "Any";
  environments: Environment[] | "any";
  duration: TimeOption;
  difficulty: Difficulty;
  steps: string[];
  checklist: string[];
  natureObservation: string;
  reflection: string;
}

// Hand-authored, safe, free missions that require no special equipment.
// These are used only when local AI is unavailable. They are clearly labelled
// as offline missions in the UI - they are never presented as AI output.
const TEMPLATES: FallbackTemplate[] = [
  {
    title: "Ten Minute Leaf Detective",
    description:
      "A short noticing walk where you track down three different leaf shapes in {env}.",
    activity: "Nature Observation",
    environments: "any",
    duration: 5,
    difficulty: "Easy",
    steps: [
      "Step outside and take three slow, deep breaths.",
      "Find three leaves with clearly different shapes.",
      "Lay them side by side and compare their edges.",
    ],
    checklist: ["Went outside", "Found 3 different leaves", "Compared their shapes"],
    natureObservation: "Notice which leaf shape catches the most light and guess why.",
    reflection: "Which leaf surprise you the most, and what did it remind you of?",
  },
  {
    title: "Five Minute Sky Check",
    description: "Pause and really look at the sky above {env} for a few quiet minutes.",
    activity: "Nature Observation",
    environments: "any",
    duration: 5,
    difficulty: "Easy",
    steps: [
      "Find a comfortable spot with a clear view upward.",
      "Watch the clouds for two full minutes without speaking.",
      "Notice the colour of the sky right at the horizon.",
    ],
    checklist: ["Found a viewing spot", "Watched for 2 minutes", "Noted the horizon colour"],
    natureObservation: "Are the clouds moving toward you or away from you?",
    reflection: "What did the sky make you feel in that quiet moment?",
  },
  {
    title: "Micro Garden Safari",
    description: "Get close to the ground and discover the tiny life living in {env}.",
    activity: "Nature Observation",
    environments: ["Garden", "Park", "Anywhere safe"],
    duration: 15,
    difficulty: "Easy",
    steps: [
      "Crouch down beside a patch of soil or grass.",
      "Watch one square metre closely for five minutes.",
      "Count every moving creature you can spot.",
      "Note where each one seemed to be heading.",
    ],
    checklist: ["Crouched close to the ground", "Watched one square metre", "Counted the creatures"],
    natureObservation: "Which tiny creature moved the fastest, and where did it go?",
    reflection: "What did you notice at ground level that you normally walk past?",
  },
  {
    title: "Colour Hunt Walk",
    description: "A gentle {time}-minute walk through {env} hunting for every colour you can find.",
    activity: "Walking",
    environments: "any",
    duration: 15,
    difficulty: "Easy",
    steps: [
      "Pick a colour to start hunting for.",
      "Walk slowly and point out every match you see.",
      "Switch to a new colour halfway through.",
      "Find one colour you did not expect.",
    ],
    checklist: ["Chose a first colour", "Switched colours midway", "Found a surprise colour"],
    natureObservation: "Which colour was rarest on your walk today?",
    reflection: "What colour kept appearing, and why do you think that is?",
  },
  {
    title: "Sound Map Sit Spot",
    description: "Sit still in {env} and map the sounds around you like a compass.",
    activity: "Nature Observation",
    environments: "any",
    duration: 15,
    difficulty: "Moderate",
    steps: [
      "Sit somewhere safe and close your eyes.",
      "Point toward the first sound you hear.",
      "Listen for the quietest sound you can detect.",
      "Open your eyes and find its source.",
      "Stay for one more silent minute.",
    ],
    checklist: ["Sat and closed eyes", "Pointed at first sound", "Found the quietest sound"],
    natureObservation: "Which sound was made by something living?",
    reflection: "Was it hard to stay still? What made it easier?",
  },
  {
    title: "Sidewalk Nature Bingo",
    description: "Turn a neighbourhood stroll into a hunt for everyday nature in {env}.",
    activity: "Walking",
    environments: ["Neighborhood", "Park", "Anywhere safe"],
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "List five things you expect to see before you leave.",
      "Walk a route you know well but look only upward for two minutes.",
      "Now look only at ground level for two minutes.",
      "Tick off everything from your list you found.",
      "Add one thing you did not expect.",
    ],
    checklist: ["Made a prediction list", "Looked up for 2 min", "Looked down for 2 min", "Crossed off finds"],
    natureObservation: "Which plant is growing where it was clearly not planted by anyone?",
    reflection: "How did looking up and down change your normal route?",
  },
  {
    title: "Cloud and Light Study",
    description: "Track how light moves across {env} over half an hour.",
    activity: "Nature Observation",
    environments: "any",
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "Choose a fixed object to watch.",
      "Note the direction and length of its shadow.",
      "Wait ten minutes and note the shadow again.",
      "Repeat once more and compare the three notes.",
    ],
    checklist: ["Chose a fixed object", "Recorded first shadow", "Compared all three readings"],
    natureObservation: "How many minutes passed before the shadow visibly moved?",
    reflection: "What does the moving light tell you about the time of day?",
  },
  {
    title: "Plant a Seed of Kindness",
    description: "Spend focused time tending plants in {env} with whatever is already there.",
    activity: "Gardening",
    environments: ["Garden", "Park", "Anywhere safe"],
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "Choose a plant that looks thirsty or crowded.",
      "Clear any litter from around its base.",
      "Loosen the soil gently with your hands or a stick.",
      "Water it if water is available and safe to use.",
      "Give it a name for the day.",
    ],
    checklist: ["Chose a plant", "Cleared litter", "Loosened soil", "Watered if possible"],
    natureObservation: "How does the underside of the leaves look compared with the top?",
    reflection: "What did caring for that plant feel like?",
  },
  {
    title: "Long Wander and Wonder",
    description: "A full hour of unhurried exploring through {env} with a wondering mind.",
    activity: "Walking",
    environments: "any",
    duration: 60,
    difficulty: "Adventurous",
    steps: [
      "Choose a direction and commit to it.",
      "Every ten minutes, pause and name one new thing you see.",
      "Take a slightly different route back.",
      "End by sitting for three quiet minutes.",
    ],
    checklist: ["Chose a direction", "Paused every 10 min", "Took a new route home", "Sat for 3 minutes"],
    natureObservation: "Which place along the walk felt most alive, and why?",
    reflection: "What thought kept returning to you on the walk?",
  },
  {
    title: "Neighborhood Tree Survey",
    description: "Walk {env} for an hour and get to know the trees that live there.",
    activity: "Walking",
    environments: ["Neighborhood", "Park", "Anywhere safe"],
    duration: 60,
    difficulty: "Adventurous",
    steps: [
      "Pick a street or path with several trees.",
      "Count how many different tree types you can find.",
      "Compare bark textures on three of them.",
      "Look for creatures using the trees.",
      "Choose a favourite and visit it last.",
    ],
    checklist: ["Counted tree types", "Compared three barks", "Looked for tree wildlife", "Picked a favourite"],
    natureObservation: "Which tree had the most life around it?",
    reflection: "If that favourite tree could talk, what would it say about the street?",
  },
  {
    title: "Snail's Pace Minute",
    description: "Move slower than you ever normally do through {env} for one minute.",
    activity: "Walking",
    environments: "any",
    duration: 5,
    difficulty: "Easy",
    steps: [
      "Take a single step, then stop completely.",
      "Look around fully before the next step.",
      "Take five steps this way.",
    ],
    checklist: ["Took a slow first step", "Looked around fully", "Completed five slow steps"],
    natureObservation: "What did you notice only because you slowed down?",
    reflection: "What usually makes you rush, and what would slow you down?",
  },
  {
    title: "Seed Spotter Challenge",
    description: "Hunt for seeds, cones and nuts scattered around {env}.",
    activity: "Nature Observation",
    environments: "any",
    duration: 15,
    difficulty: "Moderate",
    steps: [
      "Look along edges and under trees first.",
      "Collect nothing - just photograph or memorise them.",
      "Find seeds that travel in three different ways.",
    ],
    checklist: ["Searched under trees", "Found seeds", "Identified three travel styles"],
    natureObservation: "Which seed was built to fly furthest, and how do you know?",
    reflection: "What did the seeds make you think about spreading and growing?",
  },
  {
    title: "Pollinator Watch",
    description: "Find a flowering spot in {env} and quietly watch which visitors arrive.",
    activity: "Nature Observation",
    environments: ["Garden", "Park", "Anywhere safe"],
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "Find a patch of flowers that is safe to stand near.",
      "Stand still and count every visitor for ten minutes.",
      "Note what each one did - feed, rest, or pass by.",
      "Rank the flowers by popularity.",
    ],
    checklist: ["Found flowers", "Watched for 10 minutes", "Noted each visitor's behaviour"],
    natureObservation: "Which flower had the most visitors, and why might that be?",
    reflection: "What did the visitors teach you about patience?",
  },
  {
    title: "Garden Gratitude Round",
    description: "Walk the edges of {env} and notice what is thriving and what needs help.",
    activity: "Gardening",
    environments: ["Garden"],
    duration: 60,
    difficulty: "Adventurous",
    steps: [
      "Walk the full boundary of the garden slowly.",
      "List what is thriving and what is struggling.",
      "Pick one small, safe task to help a struggling plant.",
      "Finish by sitting and simply appreciating the space.",
      "Name three living things you are grateful for.",
    ],
    checklist: ["Walked the boundary", "Listed thriving and struggling", "Helped one plant", "Named three gratitudes"],
    natureObservation: "Where in the garden was life most crowded?",
    reflection: "How did helping something small change how you feel?",
  },
  {
    title: "Nature Colours of Dusk",
    description: "Observe how {env} changes as the light softens.",
    activity: "Nature Observation",
    environments: "any",
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "Pick a view to watch as light changes.",
      "Note the colours you see right now.",
      "Watch for ten minutes and note them again.",
      "Find the moment the mood of the scene shifts.",
    ],
    checklist: ["Chose a view", "Recorded first colours", "Recorded changed colours"],
    natureObservation: "Which colour disappeared first as the light changed?",
    reflection: "How did the changing light change your mood?",
  },
  {
    title: "Blindfolded Listening (Eyes Closed)",
    description: "With eyes closed and someone nearby if possible, listen deeply to {env}.",
    activity: "Nature Observation",
    environments: "any",
    duration: 5,
    difficulty: "Easy",
    steps: [
      "Stand or sit somewhere safe and stable.",
      "Close your eyes for sixty seconds.",
      "List every sound in order of distance.",
    ],
    checklist: ["Found a safe spot", "Closed eyes for a minute", "Listed sounds by distance"],
    natureObservation: "Which sound was nearest, and which was farthest?",
    reflection: "What did closing your eyes reveal that you usually miss?",
  },
  {
    title: "Walk and Wonder Questions",
    description: "Take a {time}-minute walk in {env} and collect questions instead of answers.",
    activity: "Walking",
    environments: "any",
    duration: 30,
    difficulty: "Adventurous",
    steps: [
      "Start walking at a comfortable pace.",
      "Every time you notice something, ask a why or how question.",
      "Collect at least five questions.",
      "Pick one to try to answer before you get home.",
      "Keep the rest for another day.",
    ],
    checklist: ["Started walking", "Collected five questions", "Picked one to chase"],
    natureObservation: "Which question was hardest to answer, and why?",
    reflection: "Which of your questions would you most like to solve?",
  },
  {
    title: "Surprise Sense Safari",
    description: "A wandering mission through {env} using each of your senses in turn.",
    activity: "Surprise Me",
    environments: "any",
    duration: 30,
    difficulty: "Moderate",
    steps: [
      "Pick a sense and use only that one for five minutes.",
      "Switch to a new sense and repeat.",
      "Notice which sense felt most alive today.",
      "Walk back using your least-used sense.",
    ],
    checklist: ["Used one sense at a time", "Switched senses", "Identified the strongest sense"],
    natureObservation: "Which sense gave you the richest picture of the place?",
    reflection: "What would you notice daily if you slowed down like this more often?",
  },
];

const DIFF_RANK: Record<Difficulty, number> = {
  Easy: 0,
  Moderate: 1,
  Adventurous: 2,
};

const TIME_RANK: Record<TimeOption, number> = { 5: 0, 15: 1, 30: 2, 60: 3 };

function scoreTemplate(t: FallbackTemplate, prefs: MissionPrefs): number {
  let score = 0;
  if (t.activity === prefs.activity || t.activity === "Any" || prefs.activity === "Surprise Me")
    score += 4;
  if (t.environments === "any" || t.environments.includes(prefs.environment)) score += 4;
  if (t.duration === prefs.time) score += 3;
  if (t.difficulty === prefs.difficulty) score += 2;
  // graceful proximity for non-exact matches
  score -= Math.abs(TIME_RANK[t.duration] - TIME_RANK[prefs.time]) * 0.5;
  score -= Math.abs(DIFF_RANK[t.difficulty] - DIFF_RANK[prefs.difficulty]) * 0.5;
  return score;
}

/**
 * Builds an offline mission for the given preferences from bundled templates.
 * `excludeKeys` avoids repeating a template already shown this session.
 * The returned mission is always complete and valid.
 */
export function pickOfflineMission(
  prefs: MissionPrefs,
  excludeKeys: Set<string> = new Set(),
): { mission: Mission; key: string } {
  const ranked = TEMPLATES.map((t) => ({ t, s: scoreTemplate(t, prefs) })).sort(
    (a, b) => b.s - a.s,
  );

  const usable = ranked.filter((r) => !excludeKeys.has(r.t.title));
  const pool = (usable.length > 0 ? usable : ranked).slice(0, 4);
  const chosen = pool[Math.floor(Math.random() * pool.length)].t;

  const mission: Mission = {
    id: makeId(),
    title: chosen.title,
    description: chosen.description
      .replace(/\{env\}/g, prefs.environment.toLowerCase())
      .replace(/\{time\}/g, String(prefs.time)),
    steps: chosen.steps.slice(0, 5),
    durationMinutes: prefs.time,
    difficulty: prefs.difficulty,
    checklist: chosen.checklist,
    natureObservation: chosen.natureObservation,
    reflectionQuestion: chosen.reflection,
    source: "offline",
    generatedAt: Date.now(),
  };

  return { mission, key: chosen.title };
}

export function templateCount(): number {
  return TEMPLATES.length;
}
