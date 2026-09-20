/* ─── Config ──────────────────────────────────────────────────── */
const API_URL = 'http://127.0.0.1:8000/predict';

/* ─── Element References ──────────────────────────────────────── */
const form        = document.getElementById('predict-form');
const submitBtn   = document.getElementById('submit-btn');
const formError   = document.getElementById('form-error');
const resultSec   = document.getElementById('result-section');
const scoreNumber = document.getElementById('score-number');
const scoreLabel  = document.getElementById('score-label');
const gaugeFill   = document.getElementById('gauge-fill');
const retryBtn    = document.getElementById('retry-btn');

/* ─── Gauge Constants ─────────────────────────────────────────── */
const CIRCUMFERENCE = 2 * Math.PI * 80; // 502.65

/* ─── Score Descriptor ────────────────────────────────────────── */
function getScoreLabel(score) {
  if (score >= 8)   return { text: 'Excellent mental wellbeing',  color: '#10B981' };
  if (score >= 6)   return { text: 'Good mental wellbeing',       color: '#10B981' };
  if (score >= 4.5) return { text: 'Moderate — consider self-care', color: '#F59E0B' };
  if (score >= 3)   return { text: 'Some concerns detected',      color: '#F97316' };
  return              { text: 'High concern — seek support',      color: '#EF4444' };
}

/* ─── Form Validation ─────────────────────────────────────────── */
function validateForm() {
  let valid = true;
  const errors = [];

  // Clear previous invalid states
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelector('.stress-options')?.closest('.field-group')?.classList.remove('stress-invalid');

  const fields = [
    { id: 'age',                    label: 'Age' },
    { id: 'gender',                 label: 'Gender' },
    { id: 'country',                label: 'Country' },
    { id: 'academic_level',         label: 'Academic Level' },
    { id: 'most_used_platform',     label: 'Most Used Platform' },
    { id: 'purpose_of_use',         label: 'Purpose of Use' },
    { id: 'avg_daily_usage_hours',  label: 'Avg. Daily Usage Hours' },
    { id: 'daily_unlocks',          label: 'Daily Unlocks' },
    { id: 'study_hours',            label: 'Study Hours' },
    { id: 'physical_activity_hours',label: 'Physical Activity Hours' },
    { id: 'sleep_hours_per_night',  label: 'Sleep Hours Per Night' },
  ];

  fields.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!el || el.value.trim() === '' || el.value === null) {
      el?.classList.add('invalid');
      errors.push(label);
      valid = false;
    }
  });

  // Numeric range checks
  const age = parseFloat(document.getElementById('age').value);
  if (!isNaN(age) && (age < 10 || age > 100)) {
    document.getElementById('age').classList.add('invalid');
    errors.push('Age must be between 10 and 100');
    valid = false;
  }

  const numericFields = [
    { id: 'avg_daily_usage_hours',   max: 24 },
    { id: 'study_hours',             max: 24 },
    { id: 'physical_activity_hours', max: 24 },
    { id: 'sleep_hours_per_night',   max: 24 },
  ];

  numericFields.forEach(({ id, max }) => {
    const val = parseFloat(document.getElementById(id).value);
    if (!isNaN(val) && (val < 0 || val > max)) {
      document.getElementById(id).classList.add('invalid');
      if (!errors.includes(id)) errors.push(`${id.replace(/_/g, ' ')} must be 0–${max}`);
      valid = false;
    }
  });

  // Stress level radio
  const stressChecked = form.querySelector('input[name="stress_level"]:checked');
  if (!stressChecked) {
    document.querySelector('.stress-options').closest('.field-group').classList.add('stress-invalid');
    errors.push('Stress Level');
    valid = false;
  }

  return { valid, errors };
}

/* ─── Show / Hide Error Banner ────────────────────────────────── */
function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  formError.textContent = '';
  formError.hidden = true;
}

/* ─── Build Payload ───────────────────────────────────────────── */
function buildPayload() {
  return {
    age:                     parseInt(document.getElementById('age').value, 10),
    gender:                  document.getElementById('gender').value,
    country:                 document.getElementById('country').value.trim(),
    academic_level:          document.getElementById('academic_level').value,
    most_used_platform:      document.getElementById('most_used_platform').value,
    purpose_of_use:          document.getElementById('purpose_of_use').value,
    avg_daily_usage_hours:   parseFloat(document.getElementById('avg_daily_usage_hours').value),
    daily_unlocks:           parseInt(document.getElementById('daily_unlocks').value, 10),
    study_hours:             parseFloat(document.getElementById('study_hours').value),
    physical_activity_hours: parseFloat(document.getElementById('physical_activity_hours').value),
    sleep_hours_per_night:   parseFloat(document.getElementById('sleep_hours_per_night').value),
    stress_level:            form.querySelector('input[name="stress_level"]:checked').value,
  };
}

/* ─── Animate Gauge ───────────────────────────────────────────── */
function animateGauge(score, color) {
  // score is 0–10; map to 0–1
  const ratio = Math.min(Math.max(score / 10, 0), 1);
  const offset = CIRCUMFERENCE * (1 - ratio);
  gaugeFill.style.strokeDashoffset = offset;
  gaugeFill.style.stroke = color;
}

/* ─── Show Result ─────────────────────────────────────────────── */
function showResult(score) {
  const { text, color } = getScoreLabel(score);

  scoreNumber.textContent = score.toFixed(2);
  scoreLabel.textContent  = text;
  scoreLabel.style.color  = color;

  // Reset gauge first (for repeat submissions)
  gaugeFill.style.transition = 'none';
  gaugeFill.style.strokeDashoffset = CIRCUMFERENCE;

  resultSec.hidden = false;

  // Trigger animation next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gaugeFill.style.transition = 'stroke-dashoffset 1s cubic-bezier(.22,.68,0,1.1), stroke 0.4s';
      animateGauge(score, color);
    });
  });

  resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── Set Loading State ───────────────────────────────────────── */
function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle('loading', on);
}

/* ─── Form Submit Handler ─────────────────────────────────────── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  resultSec.hidden = true;

  const { valid, errors } = validateForm();
  if (!valid) {
    const missing = [...new Set(errors)];
    showError(`Please fix the following: ${missing.join(', ')}.`);
    return;
  }

  const payload = buildPayload();
  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);

      if (response.status === 422 && errBody?.detail) {
        // FastAPI validation error — extract readable messages
        const msgs = errBody.detail.map(d => {
          const field = d.loc?.slice(-1)[0] ?? 'field';
          return `${field}: ${d.msg}`;
        });
        showError('Validation error — ' + msgs.join('; '));
      } else {
        showError(`Server error (${response.status}): ${errBody?.detail ?? 'Something went wrong. Please try again.'}`);
      }
      return;
    }

    const data = await response.json();
    const score = data.predicted_mental_health_score;

    if (typeof score !== 'number') {
      showError('Unexpected response from the server. Please try again.');
      return;
    }

    showResult(score);

  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      showError('Cannot reach the server. Make sure your FastAPI backend is running on http://127.0.0.1:8000');
    } else {
      showError('An unexpected error occurred: ' + err.message);
    }
  } finally {
    setLoading(false);
  }
});

/* ─── Retry Button ────────────────────────────────────────────── */
retryBtn.addEventListener('click', () => {
  resultSec.hidden = true;
  form.reset();
  clearError();
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Live Validation (clear red on fix) ─────────────────────── */
form.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('invalid'));
  el.addEventListener('change', () => el.classList.remove('invalid'));
});

document.querySelectorAll('input[name="stress_level"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelector('.stress-options')
      ?.closest('.field-group')
      ?.classList.remove('stress-invalid');
  });
});
