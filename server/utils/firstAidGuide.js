// My addition: injury-type-aware first aid.
// This is sent immediately when a street case is reported,
// so the reporter can help the animal while waiting for responders.

const guides = {
  'hit-by-vehicle': {
    title:  'Animal hit by vehicle',
    urgent: true,
    steps: [
      'Do NOT move the animal suddenly — possible spinal injury.',
      'Keep bystanders away and reduce noise around the animal.',
      'If breathing is laboured, gently clear the mouth/nose of debris.',
      'Place a cloth or jacket loosely over the animal to reduce shock.',
      'If bleeding heavily, apply gentle pressure with a clean cloth — do not remove.',
      'Do not give food or water.',
      'Wait for the responder — keep the animal calm with a gentle, low voice.',
    ],
  },
  'wound': {
    title:  'Visible wound / bleeding',
    urgent: false,
    steps: [
      'Do not attempt to touch the wound without gloves.',
      'If the animal allows, gently place a clean cloth over the wound.',
      'Apply light pressure — do not wrap tightly.',
      'Do not pour water, antiseptic, or any liquid on the wound.',
      'Keep the animal in shade and away from traffic.',
      'Note approximate wound size and location for the vet.',
    ],
  },
  'poisoning': {
    title:  'Suspected poisoning',
    urgent: true,
    steps: [
      'Do NOT induce vomiting unless directed by a vet.',
      'Move the animal away from the suspected poison source.',
      'If you can, photograph the poison/substance for the vet.',
      'Watch for: seizures, excessive drooling, or loss of coordination.',
      'Keep the animal warm and still.',
      'This is a medical emergency — contact the vet immediately.',
    ],
  },
  'fracture': {
    title:  'Suspected fracture / broken limb',
    urgent: false,
    steps: [
      'Do not attempt to splint or straighten the limb.',
      'Minimise movement — slide a flat board under the animal if available.',
      'Muzzle gently if the animal is biting due to pain (use a strip of cloth).',
      'Keep the animal warm with a blanket.',
      'Do not give food or water before surgery.',
    ],
  },
  'malnourished': {
    title:  'Malnourished / dehydrated animal',
    urgent: false,
    steps: [
      'Offer a small amount of plain water — do not force.',
      'Do not offer large amounts of food suddenly — can cause refeeding syndrome.',
      'A few plain biscuits or plain boiled rice is safe as a small offering.',
      'Move the animal to shade.',
      'Check for open wounds, ticks, or mange on the skin.',
    ],
  },
  'disease': {
    title:  'Sick / diseased animal',
    urgent: false,
    steps: [
      'Avoid direct contact — wear gloves or use a cloth barrier.',
      'Do not let children approach.',
      'Note symptoms: discharge, laboured breathing, fitting, skin condition.',
      'Provide shade and fresh water if the animal can access it.',
      'Await the vet — do not attempt to medicate.',
    ],
  },
  'unknown': {
    title:  'General first aid',
    urgent: false,
    steps: [
      'Keep a safe distance until the responder arrives.',
      'Reduce noise and crowds around the animal.',
      'Provide shade if possible.',
      'Do not attempt to pick up or restrain the animal unless trained.',
      'Stay on the call with the vet if they contact you.',
    ],
  },
};

const getFirstAidGuide = (injuryType, severity) => {
  const guide = guides[injuryType] || guides['unknown'];

  // High severity always marks urgent
  if (severity >= 4) guide.urgent = true;

  return {
    ...guide,
    severityNote: severity >= 4
      ? 'CRITICAL: This appears to be a serious case. Responders have been prioritised.'
      : severity >= 3
      ? 'MODERATE: A responder is on the way. Follow the steps below carefully.'
      : 'MILD: Follow the steps below and await your assigned responder.',
  };
};

module.exports = { getFirstAidGuide };