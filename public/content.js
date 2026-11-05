// Original, curated English teaching samples. Not AI generated at runtime.
export const skills = [
  "Grammar",
  "Sentence structure",
  "Writing",
  "Listening",
  "Reading",
];
export const levels = [
  "Not observed",
  "Needs support",
  "Developing",
  "Secure",
  "Ready to stretch",
];
export const routes = ["Support", "Core", "Stretch"];
export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const topics = [
  {
    id: "daily-routines",
    title: "Small habits, big days",
    skill: "Grammar",
    grade: "P4 to P6",
    description: "Present simple through the routines learners already know.",
    objective: "Choose a present-simple verb that agrees with its subject.",
    model:
      "I walk to school. Maya walks to school. With he, she or it, we usually add -s or -es. After does, use the base verb: Does Maya walk?",
    misconception:
      "Adding -s after does: “Does she walks?” Use “Does she walk?”",
    support:
      "Underline the subject first. Say I walk / she walks aloud. Use the verb bank to complete each sentence.",
    core: "Choose the verb that matches the subject. Explain one choice to a partner before checking.",
    stretch:
      "Write two sentences about your routine and two about a friend. Explain why the verb changes. This extension is optional.",
    questions: [
      {
        stem: "Every morning, she ___ to school.",
        options: ["walk", "walks", "walking"],
        answer: 1,
        why: "She is third-person singular. In the present simple, use walks.",
      },
      {
        stem: "My friends ___ breakfast at seven.",
        options: ["eats", "eating", "eat"],
        answer: 2,
        why: "My friends is plural. Use the base form eat.",
      },
      {
        stem: "Does Leo ___ on Saturdays?",
        options: ["swims", "swim", "swimming"],
        answer: 1,
        why: "After does, use the base form swim.",
      },
    ],
    exit: "Write one new sentence with she and explain your verb choice.",
    challenge:
      "Write a question about a friend’s routine using does. Explain why its main verb has no -s.",
    rubric: [
      "Subject and verb agree",
      "A routine is clear",
      "The explanation names the subject",
    ],
    transcript: "",
  },
  {
    id: "sentence-builders",
    title: "Give a sentence a job",
    skill: "Sentence structure",
    grade: "P4 to P6",
    description:
      "Build complete ideas with subjects, verbs and connecting words.",
    objective: "Join two related ideas with because, but or so.",
    model:
      "I took an umbrella because it was raining. Because gives a reason. But shows a contrast. So introduces a result.",
    misconception:
      "Using because and so together for the same link. Choose the one that fits the intended meaning.",
    support:
      "Read each pair of ideas aloud. Label the link as reason, contrast or result, then use the connector bank.",
    core: "Choose a connector and explain how it links the two ideas.",
    stretch:
      "Describe the same event in two sentences, using because in one and so in the other. Keep the meaning consistent.",
    questions: [
      {
        stem: "I stayed inside ___ it was raining.",
        options: ["because", "but", "or"],
        answer: 0,
        why: "The rain is the reason for staying inside. Because introduces the reason.",
      },
      {
        stem: "The bag was small, ___ it held all my books.",
        options: ["because", "but", "so"],
        answer: 1,
        why: "Holding all the books contrasts with the bag being small.",
      },
      {
        stem: "The bus was late, ___ we walked.",
        options: ["but", "because", "so"],
        answer: 2,
        why: "Walking is the result of the bus being late.",
      },
    ],
    exit: "Join two new ideas with because. Underline the reason.",
    challenge:
      "Rewrite “I was tired, so I rested” using because without changing its meaning.",
    rubric: [
      "Both ideas are complete",
      "The connector matches the relationship",
      "Meaning stays clear",
    ],
    transcript: "",
  },
  {
    id: "little-stories",
    title: "A story worth sharing",
    skill: "Writing",
    grade: "P4 to P6",
    description:
      "Plan a short story with a clear beginning, problem and ending.",
    objective:
      "Plan and write a short narrative with a connected sequence of events.",
    model:
      "On Saturday, Eli found a wet kitten outside the library. He asked the librarian for help. Together, they called an animal rescue service. By the afternoon, the kitten was safe.",
    misconception:
      "Adding events without a connection. Ask how each event changes what happens next.",
    support:
      "Plan three moments using First, Next and Finally. Use the model as a structure, then choose your own characters.",
    core: "Plan a character, a problem and a response. Write a short paragraph and check the order of events.",
    stretch:
      "Use one detail of dialogue or setting to show how your character feels. Explain the effect you wanted.",
    questions: [],
    exit: "Underline the sentence that resolves your story’s problem.",
    challenge:
      "Write an alternative ending. Explain how it changes the reader’s view of the character.",
    rubric: [
      "The beginning establishes a situation",
      "Events follow a clear sequence",
      "The ending responds to the problem",
    ],
    transcript: "",
  },
  {
    id: "listen-plan",
    title: "Listen for the little things",
    skill: "Listening",
    grade: "P4 to P6",
    description: "Listen for specific information in a weekend plan.",
    objective:
      "Identify a meeting time, place and required item in a short spoken message.",
    model:
      "Before listening, decide what information you need. During the first listen, notice the situation. Listen again for the time, place and item.",
    misconception:
      "Choosing an early detail after a speaker corrects it. Listen for words such as actually.",
    support:
      "Preview the questions. Listen twice and note one key word for each answer. The transcript is available whenever you need it.",
    core: "Listen for the three details. Check whether the speaker changes any part of the plan.",
    stretch:
      "Explain which detail changed and identify the words that signalled the change.",
    transcript:
      "Hi everyone. Our reading club will meet on Saturday at ten o’clock. We first planned to meet in the playground. Actually, let’s meet in the library because it may rain. Please bring your favourite book. You don’t need to bring any snacks.",
    questions: [
      {
        stem: "When will the reading club meet?",
        options: ["Saturday at ten", "Sunday at ten", "Saturday at twelve"],
        answer: 0,
        why: "The speaker says Saturday at ten o’clock.",
      },
      {
        stem: "Where will the group meet?",
        options: ["In the playground", "In the library", "At a café"],
        answer: 1,
        why: "Actually signals a change. The final meeting place is the library.",
      },
      {
        stem: "What should learners bring?",
        options: ["Snacks", "An umbrella", "A favourite book"],
        answer: 2,
        why: "The speaker asks everyone to bring their favourite book.",
      },
    ],
    exit: "Summarise the final plan in one sentence.",
    challenge:
      "Explain how actually changes the message. Name one listening strategy you would use again.",
    rubric: [
      "Final details are accurate",
      "The changed plan is recognised",
      "A useful listening strategy is named",
    ],
  },
  {
    id: "reading-clues",
    title: "Read between the lines",
    skill: "Reading",
    grade: "P4 to P6",
    description: "Use clues in a short text to explain an inference.",
    objective:
      "Make a simple inference and support it with evidence from a text.",
    model:
      "A good inference combines a clue from the text with a sensible explanation. Name the clue before saying what it suggests.",
    misconception:
      "Treating a guess as evidence. An inference must connect to words in the text.",
    support:
      "Find the sentence that shows a feeling. Use “I think ... because the text says ...” to explain.",
    core: "Choose the best inference and identify the clue that supports it.",
    stretch:
      "Suggest a second possible inference. Compare its evidence with your first one.",
    transcript:
      "Amir stood outside the classroom, holding his drawing with both hands. He checked the name on the door twice. When the teacher smiled and waved, his shoulders relaxed and he stepped inside.",
    questions: [
      {
        stem: "How did Amir probably feel at first?",
        options: ["Nervous", "Bored", "Angry"],
        answer: 0,
        why: "Checking the door twice and holding the drawing carefully suggest nervousness.",
      },
      {
        stem: "Which detail suggests that Amir became calmer?",
        options: [
          "He held a drawing",
          "His shoulders relaxed",
          "There was a name on the door",
        ],
        answer: 1,
        why: "Relaxed shoulders are a physical clue that he feels calmer.",
      },
      {
        stem: "Which statement is directly stated?",
        options: [
          "Amir is a new student",
          "Amir dislikes drawing",
          "The teacher smiled and waved",
        ],
        answer: 2,
        why: "The text states that the teacher smiled and waved. The other claims are not stated.",
      },
    ],
    exit: "Explain one inference using a specific clue.",
    challenge:
      "Could Amir have been excited as well as nervous? Compare the evidence for both feelings.",
    rubric: [
      "An inference is plausible",
      "Evidence is specific",
      "The explanation links evidence and inference",
    ],
  },
];

export function routeFor(level) {
  return !level || level < 2 ? "Support" : level < 4 ? "Core" : "Stretch";
}
export function defaultSegments(duration = 60) {
  const weights = [0.1, 0.2, 0.25, 0.1, 0.25];
  const names = [
    "Retrieve & connect",
    "Model & think aloud",
    "Guided practice",
    "Pause & reset",
    "Independent practice",
  ];
  const mins = weights.map((w) => Math.floor(duration * w));
  mins.push(duration - mins.reduce((a, b) => a + b, 0));
  return [...names, "Exit ticket & reflect"].map((title, i) => ({
    title,
    minutes: mins[i],
  }));
}
