import { API_BASE_URL } from '../shared/config.js';

const data = {
  program: '',
  full_name: '',
  mobile: '',
  email: '',
  alumnus_up: '',
  connected_pgh: '',
  occupation: '',
  year_joined: '',
  prc_license: '',
  department_office: '',
  college: '',
  course: '',
  year_level: ''
};

let currentStep = 1;
const TOTAL_STEPS = 2;
let lastUid = '';

const STEP_NAMES = [
  'Basic Info',
  'Additional Details'
];

const PROGRAMS = [
  'Tutorial Service Program',
  'Health Training Program',
  'Disaster Preparedness & Risk Management Program'
];

const OCCUPATIONS = [
  'Licensed Professional',
  'Student',
  'Other'
];

const YEARS = ['2024','2023','2022','2021','2020','2019','2018'];

const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate'
];

function apiFetch(path, options = {}) {
  const opts = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  return fetch(`${API_BASE_URL}${path}`, opts)
    .then(async res => {
      let body = null;
      try {
        body = await res.json();
      } catch (e) {
        body = null;
      }

      if (!res.ok || !body || body.success === false) {
        const message = body && body.message ? body.message : 'Request failed.';
        throw new Error(message);
      }
      return body;
    });
}

let cardRoot = null;
function bindEvents() {
  cardRoot = document.getElementById('mainCard');
  if (!cardRoot) return;

  cardRoot.addEventListener('click', e => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.preventDefault();
      const action = actionBtn.dataset.action;
      if (action === 'next') next();
      else if (action === 'back') back();
      else if (action === 'reset') resetForm();
      else if (action === 'copy-uid') copyUid();
      return;
    }

    const choiceBtn = e.target.closest('[data-choice-value]');
    if (choiceBtn) {
      const parent = choiceBtn.closest('[data-choice]');
      if (!parent) return;
      const key = parent.dataset.choice;
      const val = choiceBtn.dataset.choiceValue;
      data[key] = val;
      parent.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.toggle('active', btn === choiceBtn);
      });
      clearErr(key);
      toggleChoiceError(key, false);
      updateStepButtons();
      return;
    }
  });
}

function render() {
  const card = document.getElementById('mainCard');
  const progressFill = document.getElementById('progressFill');
  const stepLabel = document.getElementById('stepLabel');
  const stepName = document.getElementById('stepName');

  if (!card || !progressFill || !stepLabel || !stepName) {
    return;
  }

  progressFill.style.width = ((currentStep / TOTAL_STEPS) * 100) + '%';
  stepLabel.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
  stepName.textContent = STEP_NAMES[currentStep - 1];

  card.innerHTML = '';
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';

  if (currentStep === 1) renderStep1(card);
  else if (currentStep === 2) renderStep2(card);
}

function val(id) { return document.getElementById(id)?.value.trim() || ''; }

function showErr(id, msg) {
  const el = document.getElementById(id + '_err');
  const inp = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
  if (inp) inp.classList.add('err');
}

function clearErr(id) {
  const el = document.getElementById(id + '_err');
  const inp = document.getElementById(id);
  if (el) el.classList.remove('show');
  if (inp) inp.classList.remove('err');
}

function toggleChoiceError(id, show) {
  const row = document.querySelector(`[data-choice="${id}"]`);
  if (row) row.classList.toggle('err', !!show);
}

function validMobile(phone) {
  const digits = phone.replace(/\D/g, '');
  return /^09\d{9}$/.test(digits);
}

function isStep1Valid() {
  if (!val('program')) return false;
  if (!val('full_name')) return false;
  if (!val('mobile') || !validMobile(val('mobile'))) return false;
  if (!val('email') || !/^\S+@\S+\.\S+$/.test(val('email'))) return false;
  if (!data.alumnus_up) return false;
  if (!data.connected_pgh) return false;
  if (!val('occupation')) return false;
  if (!val('year_joined')) return false;
  return true;
}

function isStep2Valid() {
  const occ = data.occupation || val('occupation');
  if (!occ) return false;
  if (occ === 'Licensed Professional') {
    const lic = val('prc_license');
    if (!lic || !/^\d{1,7}$/.test(lic)) return false;
    if (!val('department_office')) return false;
  }
  if (occ === 'Student') {
    if (!val('college')) return false;
    if (!val('course')) return false;
    if (!val('year_level')) return false;
  }
  return true;
}

function validateStep(showErrors) {
  let ok = true;
  if (currentStep === 1) {
    if (!val('program')) { if (showErrors) showErr('program', 'Please select a program.'); ok = false; }
    else clearErr('program');

    if (!val('full_name')) { if (showErrors) showErr('full_name', 'This field is required.'); ok = false; }
    else clearErr('full_name');

    if (!val('mobile')) { if (showErrors) showErr('mobile', 'This field is required.'); ok = false; }
    else if (!validMobile(val('mobile'))) { if (showErrors) showErr('mobile', 'Use format 09XX XXX XXXX.'); ok = false; }
    else clearErr('mobile');

    if (!val('email')) { if (showErrors) showErr('email', 'This field is required.'); ok = false; }
    else if (!/^\S+@\S+\.\S+$/.test(val('email'))) { if (showErrors) showErr('email', 'Enter a valid email address.'); ok = false; }
    else clearErr('email');

    if (!data.alumnus_up) { if (showErrors) showErr('alumnus_up', 'Please select an option.'); toggleChoiceError('alumnus_up', true); ok = false; }
    else { clearErr('alumnus_up'); toggleChoiceError('alumnus_up', false); }

    if (!data.connected_pgh) { if (showErrors) showErr('connected_pgh', 'Please select an option.'); toggleChoiceError('connected_pgh', true); ok = false; }
    else { clearErr('connected_pgh'); toggleChoiceError('connected_pgh', false); }

    if (!val('occupation')) { if (showErrors) showErr('occupation', 'Please select an occupation.'); ok = false; }
    else clearErr('occupation');

    if (!val('year_joined')) { if (showErrors) showErr('year_joined', 'Please select a year.'); ok = false; }
    else clearErr('year_joined');
  }

  if (currentStep === 2) {
    const occ = data.occupation || val('occupation');
    if (!occ) ok = false;
    if (occ === 'Licensed Professional') {
      const lic = val('prc_license');
      if (!lic) { if (showErrors) showErr('prc_license', 'PRC license number is required.'); ok = false; }
      else if (!/^\d{1,7}$/.test(lic)) { if (showErrors) showErr('prc_license', 'Must be 1 to 7 digits.'); ok = false; }
      else clearErr('prc_license');

      if (!val('department_office')) { if (showErrors) showErr('department_office', 'This field is required.'); ok = false; }
      else clearErr('department_office');
    }

    if (occ === 'Student') {
      if (!val('college')) { if (showErrors) showErr('college', 'This field is required.'); ok = false; }
      else clearErr('college');

      if (!val('course')) { if (showErrors) showErr('course', 'This field is required.'); ok = false; }
      else clearErr('course');

      if (!val('year_level')) { if (showErrors) showErr('year_level', 'Please select a year level.'); ok = false; }
      else clearErr('year_level');
    }
  }
  return ok;
}

function updateStepButtons() {
  if (currentStep === 1) {
    const btn = document.querySelector('[data-action="next"]');
    if (btn) btn.disabled = !isStep1Valid();
  }
  if (currentStep === 2) {
    const btn = document.getElementById('submitBtn');
    if (btn) btn.disabled = !isStep2Valid();
  }
}

function saveStep() {
  if (currentStep === 1) {
    data.program = val('program');
    data.full_name = val('full_name');
    data.mobile = val('mobile');
    data.email = val('email');
    data.occupation = val('occupation');
    data.year_joined = val('year_joined');
  }
  if (currentStep === 2) {
    const occ = data.occupation || val('occupation');
    if (occ === 'Licensed Professional') {
      data.prc_license = val('prc_license');
      data.department_office = val('department_office');
      data.college = '';
      data.course = '';
      data.year_level = '';
    } else if (occ === 'Student') {
      data.college = val('college');
      data.course = val('course');
      data.year_level = val('year_level');
      data.prc_license = '';
      data.department_office = '';
    } else {
      data.prc_license = '';
      data.department_office = '';
      data.college = '';
      data.course = '';
      data.year_level = '';
    }
  }
}

function next() {
  if (!validateStep(true)) return;
  saveStep();
  if (currentStep < TOTAL_STEPS) { currentStep++; render(); }
  else { submitForm(); }
}

function back() {
  if (currentStep > 1) { saveStep(); currentStep--; render(); }
}

function renderStep1(c) {
  c.innerHTML = `
    <div class="step-label">Step 1 of 2</div>
    <div class="step-title">Basic Information</div>
    <div class="step-desc">Tell us about your program and contact details.</div>

    <div class="field">
      <label>Program <span>*</span></label>
      <select id="program">
        <option value="">Select program</option>
        ${PROGRAMS.map(p => `<option value="${p}" ${data.program === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
      <div class="err-msg" id="program_err"></div>
    </div>

    <div class="field">
      <label>Full Name <span>*</span></label>
      <input id="full_name" type="text" placeholder="e.g. Maria Santos" value="${data.full_name}"/>
      <div class="err-msg" id="full_name_err"></div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Mobile Number <span>*</span></label>
        <input id="mobile" type="tel" placeholder="09XX XXX XXXX" value="${data.mobile}"/>
        <div class="err-msg" id="mobile_err"></div>
      </div>
      <div class="field">
        <label>Email <span>*</span></label>
        <input id="email" type="email" placeholder="you@example.com" value="${data.email}"/>
        <div class="err-msg" id="email_err"></div>
      </div>
    </div>

    <div class="field">
      <label>Are you an alumnus of UP? <span>*</span></label>
      <div class="choice-row" data-choice="alumnus_up">
        <button type="button" class="choice-btn ${data.alumnus_up === 'Yes' ? 'active' : ''}" data-choice-value="Yes">Yes</button>
        <button type="button" class="choice-btn ${data.alumnus_up === 'No' ? 'active' : ''}" data-choice-value="No">No</button>
      </div>
      <div class="err-msg" id="alumnus_up_err"></div>
    </div>

    <div class="field">
      <label>Are you connected with PGH? <span>*</span></label>
      <div class="choice-row" data-choice="connected_pgh">
        <button type="button" class="choice-btn ${data.connected_pgh === 'Yes' ? 'active' : ''}" data-choice-value="Yes">Yes</button>
        <button type="button" class="choice-btn ${data.connected_pgh === 'No' ? 'active' : ''}" data-choice-value="No">No</button>
      </div>
      <div class="err-msg" id="connected_pgh_err"></div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Occupation <span>*</span></label>
        <select id="occupation">
          <option value="">Select occupation</option>
          ${OCCUPATIONS.map(o => `<option value="${o}" ${data.occupation === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
        <div class="err-msg" id="occupation_err"></div>
      </div>
      <div class="field">
        <label>Year Joined <span>*</span></label>
        <select id="year_joined">
          <option value="">Select year</option>
          ${YEARS.map(y => `<option value="${y}" ${data.year_joined === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <div class="err-msg" id="year_joined_err"></div>
      </div>
    </div>

    <div class="btn-row">
      <div></div>
      <button class="btn btn-primary" type="button" data-action="next">Next</button>
    </div>
  `;

  bindStep1Validation();
  updateStepButtons();
}

function renderStep2(c) {
  const occ = data.occupation || '';

  let fields = '';
  if (occ === 'Licensed Professional') {
    fields = `
      <div class="field">
        <label>PRC License Number <span>*</span></label>
        <input id="prc_license" type="text" inputmode="numeric" maxlength="7" placeholder="Up to 7 digits" value="${data.prc_license}"/>
        <div class="err-msg" id="prc_license_err"></div>
      </div>
      <div class="field">
        <label>Department / Office <span>*</span></label>
        <input id="department_office" type="text" placeholder="e.g. Internal Medicine" value="${data.department_office}"/>
        <div class="err-msg" id="department_office_err"></div>
      </div>
    `;
  } else if (occ === 'Student') {
    fields = `
      <div class="field">
        <label>College <span>*</span></label>
        <input id="college" type="text" placeholder="e.g. College of Medicine" value="${data.college}"/>
        <div class="err-msg" id="college_err"></div>
      </div>
      <div class="field">
        <label>Course <span>*</span></label>
        <input id="course" type="text" placeholder="e.g. BS Biology" value="${data.course}"/>
        <div class="err-msg" id="course_err"></div>
      </div>
      <div class="field">
        <label>Year Level <span>*</span></label>
        <select id="year_level">
          <option value="">Select year level</option>
          ${YEAR_LEVELS.map(y => `<option value="${y}" ${data.year_level === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <div class="err-msg" id="year_level_err"></div>
      </div>
    `;
  } else if (occ === 'Other') {
    fields = `
      <div class="notice-green">You're all good, submit your registration.</div>
    `;
  } else {
    fields = `
      <div class="global-err show" style="margin-bottom:18px">Please go back and choose an occupation.</div>
    `;
  }

  c.innerHTML = `
    <div class="step-label">Step 2 of 2</div>
    <div class="step-title">Additional Details</div>
    <div class="step-desc">We only ask for what applies to your occupation.</div>
    ${fields}
    <div class="global-err" id="submit_err"></div>
    <div class="btn-row">
      <button class="btn btn-back" type="button" data-action="back">Back</button>
      <button class="btn btn-submit" id="submitBtn" type="button" data-action="next">Submit Registration</button>
    </div>
  `;

  bindStep2Validation();
  updateStepButtons();
}

function bindStep1Validation() {
  const ids = ['program','full_name','mobile','email','occupation','year_joined'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, () => {
      clearErr(id);
      updateStepButtons();
    });
  });

  const mobileEl = document.getElementById('mobile');
  if (mobileEl) {
    mobileEl.addEventListener('input', () => {
      mobileEl.value = mobileEl.value.replace(/[^\d\s]/g, '').slice(0, 13);
    });
  }
}

function bindStep2Validation() {
  const occ = data.occupation || '';
  if (occ === 'Licensed Professional') {
    const lic = document.getElementById('prc_license');
    if (lic) {
      lic.addEventListener('input', () => {
        lic.value = lic.value.replace(/\D/g, '').slice(0, 7);
        clearErr('prc_license');
        updateStepButtons();
      });
    }
    const dept = document.getElementById('department_office');
    if (dept) {
      dept.addEventListener('input', () => {
        clearErr('department_office');
        updateStepButtons();
      });
    }
  }

  if (occ === 'Student') {
    ['college','course','year_level'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, () => {
        clearErr(id);
        updateStepButtons();
      });
    });
  }
}

async function submitForm() {
  const btn = document.getElementById('submitBtn');
  const errBox = document.getElementById('submit_err');
  if (!validateStep(true)) return;

  btn.disabled = true;
  btn.textContent = 'Submitting...';
  errBox.classList.remove('show');

  const payload = {
    program: data.program,
    full_name: data.full_name,
    mobile: data.mobile,
    email: data.email,
    alumnus_up: data.alumnus_up,
    connected_pgh: data.connected_pgh,
    occupation: data.occupation,
    year_joined: data.year_joined,
    prc_license: data.prc_license,
    department_office: data.department_office,
    college: data.college,
    course: data.course,
    year_level: data.year_level
  };

  try {
    const res = await apiFetch('/api/volunteers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    lastUid = res.data.uid;
    showThankYou(res.data.uid);
  } catch (err) {
    errBox.textContent = err.message || 'Submission failed. Please try again.';
    errBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Submit Registration';
  }
}

function showThankYou(uid) {
  document.getElementById('progressWrap').style.display = 'none';
  const card = document.getElementById('mainCard');
  card.innerHTML = `
    <div class="thankyou">
      <div class="icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>You're registered!</h2>
      <p>Thank you for signing up to volunteer. We're excited to have you on board and will be in touch soon.</p>
      <div class="uid-box">
        <div class="uid-label">Your Volunteer ID</div>
        <div class="uid-value" id="uidValue">${uid}</div>
        <div class="uid-note">Please save this ID for your records. You may need it for future reference.</div>
      </div>
      <div class="btn-row" style="justify-content:center">
        <button class="btn-copy" id="copyUidBtn" type="button" data-action="copy-uid">Copy UID</button>
        <button class="btn-new" type="button" data-action="reset">Register Another</button>
      </div>
    </div>
  `;
}

async function copyUid() {
  const uid = lastUid || document.getElementById('uidValue')?.textContent || '';
  if (!uid) return;
  const btn = document.getElementById('copyUidBtn');
  const original = btn ? btn.textContent : '';

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(uid);
    } else {
      const range = document.createRange();
      const node = document.getElementById('uidValue');
      if (node) {
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
      }
    }
    if (btn) {
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = original || 'Copy UID'; }, 1500);
    }
  } catch (e) {
    if (btn) {
      btn.textContent = 'Copy failed';
      setTimeout(() => { btn.textContent = original || 'Copy UID'; }, 1500);
    }
  }
}

function resetForm() {
  Object.keys(data).forEach(k => {
    data[k] = '';
  });
  currentStep = 1;
  lastUid = '';
  document.getElementById('progressWrap').style.display = '';
  render();
}

function init() {
  bindEvents();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

