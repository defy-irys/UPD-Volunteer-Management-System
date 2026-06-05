import { API_BASE_URL } from '../shared/config.js';

const currentYear = String(new Date().getFullYear());

const data = {
  programs: [],
  last_name: '',
  first_name: '',
  middle_name: '',
  address: '',
  mobile: '',
  telephone: '',
  email: '',
  birthday: '',
  age: '',
  civil_status: '',
  sex: '',
  blood_type: '',
  religion: '',
  health_conditions: '',
  food_restrictions: '',
  special_skills: '',
  alumnus_up: '',
  alumnus_cu: '',
  connected_pgh: '',
  pgh_details: '',
  main_occupations: [],
  licensed_status: '',
  occupation_other: '',
  prc_license: '',
  department_office: '',
  unit_company: '',
  office_address: '',
  tel_fax_nos: '',
  work_email: '',
  current_work_schedule: '',
  student_no: '',
  college: '',
  course: '',
  year_level: '',
  affiliations: ['', '', ''],
  volunteer_activities: ['', '', ''],
  beneficiaries_name: '',
  beneficiaries_relationship: '',
  beneficiaries_contact: '',
  availability: '',
  availability_other: ''
};

let currentStep = 1;
const TOTAL_STEPS = 5;
let lastUid = '';

const STEP_NAMES = [
  'Programs',
  'Personal Info',
  'Occupation',
  'Activities',
  'Emergency Info'
];

const PROGRAMS = [
  'Teachers Development Program / Gurong Pahinungod',
  'Tutorial Services Program',
  'Day Care Program',
  'Affirmative Action Program',
  'Summer Immersion Service Program',
  'Program for the Street Children',
  'Livelihood Program',
  'Health Mission Program',
  'Emergency Room Volunteers Program',
  'Hospice Care Program - Supportive, Hospice and Palliative Medicine',
  'Environmental Health Program',
  'Advocacy Program',
  'Research Program'
];

const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated'];
const SEXES = ['Female', 'Male', 'Prefer not to say'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const OCCUPATIONS = ['Physician', 'Dentist', 'Nurse', 'ENT', 'Pharmacist', 'Teacher', 'Student', 'Other'];
const LICENSED_OCCUPATIONS = ['Physician', 'Dentist', 'Nurse', 'ENT', 'Pharmacist', 'Teacher'];
const LICENSED_STATUSES = ['Licensed', 'Intern / Trainee'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];
const AVAILABILITY = ['Immediately', 'Next Week', 'Next Month', 'Others'];

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
      else if (action === 'bypass-next') bypassNext();
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
      if (key === 'licensed_status' || key === 'availability') {
        saveStep();
      }
      data[key] = val;
      if (key === 'licensed_status' && val === 'Intern / Trainee') {
        data.prc_license = '';
      }
      parent.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.toggle('active', btn === choiceBtn);
      });
      clearErr(key);
      toggleChoiceError(key, false);
      if (key === 'licensed_status' || key === 'availability') {
        render();
        return;
      }
      updateStepButtons();
    }
  });
}

function render() {
  const card = document.getElementById('mainCard');
  const progressFill = document.getElementById('progressFill');
  const stepLabel = document.getElementById('stepLabel');
  const stepName = document.getElementById('stepName');

  if (!card || !progressFill || !stepLabel || !stepName) return;

  progressFill.style.width = ((currentStep / TOTAL_STEPS) * 100) + '%';
  stepLabel.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
  stepName.textContent = STEP_NAMES[currentStep - 1];

  card.innerHTML = '';
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';

  if (currentStep === 1) renderStep1(card);
  else if (currentStep === 2) renderStep2(card);
  else if (currentStep === 3) renderStep3(card);
  else if (currentStep === 4) renderStep4(card);
  else if (currentStep === 5) renderStep5(card);
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function validEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function isChecked(key, value) {
  return data[key].includes(value);
}

function optionList(items, selected) {
  return items.map(item => `<option value="${esc(item)}" ${selected === item ? 'selected' : ''}>${esc(item)}</option>`).join('');
}

function checkGrid(key, items) {
  return `
    <div class="check-grid" data-check-group="${key}">
      ${items.map(item => `
        <label class="check-item ${isChecked(key, item) ? 'active' : ''}">
          <input type="checkbox" value="${esc(item)}" ${isChecked(key, item) ? 'checked' : ''}/>
          ${esc(item)}
        </label>
      `).join('')}
    </div>
  `;
}

function isStepValid() {
  return validateStep(false);
}

function validateStep(showErrors) {
  let ok = true;

  const requireField = (id, message = 'This field is required.') => {
    if (!val(id)) {
      if (showErrors) showErr(id, message);
      ok = false;
    } else {
      clearErr(id);
    }
  };

  if (currentStep === 1) {
    if (!data.programs.length) {
      if (showErrors) showErr('programs', 'Please select at least one volunteer program.');
      ok = false;
    } else {
      clearErr('programs');
    }
  }

  if (currentStep === 2) {
    [
      'last_name', 'first_name', 'address', 'birthday', 'age', 'civil_status',
      'sex', 'blood_type', 'religion', 'health_conditions', 'food_restrictions',
      'special_skills'
    ].forEach(id => requireField(id));

    if (!val('mobile')) { if (showErrors) showErr('mobile', 'This field is required.'); ok = false; }
    else if (!validMobile(val('mobile'))) { if (showErrors) showErr('mobile', 'Use format 09XX XXX XXXX.'); ok = false; }
    else clearErr('mobile');

    if (!val('email')) { if (showErrors) showErr('email', 'This field is required.'); ok = false; }
    else if (!validEmail(val('email'))) { if (showErrors) showErr('email', 'Enter a valid email address.'); ok = false; }
    else clearErr('email');

    if (!data.alumnus_up) { if (showErrors) showErr('alumnus_up', 'Please select an option.'); toggleChoiceError('alumnus_up', true); ok = false; }
    else { clearErr('alumnus_up'); toggleChoiceError('alumnus_up', false); }
    if (data.alumnus_up === 'Yes') requireField('alumnus_cu', 'Please specify your constituent unit.');

    if (!data.connected_pgh) { if (showErrors) showErr('connected_pgh', 'Please select an option.'); toggleChoiceError('connected_pgh', true); ok = false; }
    else { clearErr('connected_pgh'); toggleChoiceError('connected_pgh', false); }
    if (data.connected_pgh === 'Yes') requireField('pgh_details', 'Please specify your UP-PGH connection.');
  }

  if (currentStep === 3) {
    const selectedOccupation = data.main_occupations[0] || '';

    if (!selectedOccupation) {
      if (showErrors) showErr('main_occupations', 'Please select your main occupation.');
      ok = false;
    } else {
      clearErr('main_occupations');
    }

    if (LICENSED_OCCUPATIONS.includes(selectedOccupation)) {
      if (!data.licensed_status) {
        if (showErrors) showErr('licensed_status', 'Please select your license status.');
        toggleChoiceError('licensed_status', true);
        ok = false;
      } else {
        clearErr('licensed_status');
        toggleChoiceError('licensed_status', false);
      }

      if (data.licensed_status === 'Licensed') requireField('prc_license', 'PRC license number is required.');
      ['department_office', 'unit_company', 'office_address', 'tel_fax_nos', 'work_email', 'current_work_schedule']
        .forEach(id => requireField(id));

      if (val('work_email') && !validEmail(val('work_email'))) {
        if (showErrors) showErr('work_email', 'Enter a valid email address.');
        ok = false;
      }
    }

    if (selectedOccupation === 'Student') {
      ['student_no', 'college', 'course', 'year_level'].forEach(id => requireField(id));
    }

    if (selectedOccupation === 'Other') {
      requireField('occupation_other', 'Please specify your occupation.');
    }
  }

  if (currentStep === 4) {
    if (!val('affiliation_0')) {
      if (showErrors) showErr('affiliation_0', 'Please enter at least one affiliation or organization.');
      ok = false;
    } else {
      clearErr('affiliation_0');
    }

    if (!val('volunteer_activity_0')) {
      if (showErrors) showErr('volunteer_activity_0', 'Please enter at least one volunteer activity.');
      ok = false;
    } else {
      clearErr('volunteer_activity_0');
    }
  }

  if (currentStep === 5) {
    ['beneficiaries_name', 'beneficiaries_relationship', 'beneficiaries_contact'].forEach(id => requireField(id));

    if (!data.availability) {
      if (showErrors) showErr('availability', 'Please select your available time for deployment.');
      toggleChoiceError('availability', true);
      ok = false;
    } else {
      clearErr('availability');
      toggleChoiceError('availability', false);
    }

    if (data.availability === 'Others') requireField('availability_other', 'Please specify your availability.');
  }

  return ok;
}

function updateStepButtons() {
  const nextBtn = document.querySelector('[data-action="next"]');
  if (nextBtn) nextBtn.disabled = !isStepValid();
}

function saveStep() {
  if (currentStep === 2) {
    [
      'last_name', 'first_name', 'middle_name', 'address', 'mobile', 'telephone', 'email',
      'birthday', 'age', 'civil_status', 'sex', 'blood_type', 'religion',
      'health_conditions', 'food_restrictions', 'special_skills', 'alumnus_cu', 'pgh_details'
    ].forEach(id => { data[id] = val(id); });
  }

  if (currentStep === 3) {
    [
      'occupation_other', 'prc_license', 'department_office', 'unit_company', 'office_address',
      'tel_fax_nos', 'work_email', 'current_work_schedule', 'student_no', 'college', 'course', 'year_level'
    ].forEach(id => { data[id] = val(id); });

    const selectedOccupation = data.main_occupations[0] || '';
    if (!LICENSED_OCCUPATIONS.includes(selectedOccupation)) {
      data.licensed_status = '';
      ['prc_license', 'department_office', 'unit_company', 'office_address', 'tel_fax_nos', 'work_email', 'current_work_schedule']
        .forEach(id => { data[id] = ''; });
    }
    if (data.licensed_status === 'Intern / Trainee') {
      data.prc_license = '';
    }
    if (selectedOccupation !== 'Student') {
      ['student_no', 'college', 'course', 'year_level'].forEach(id => { data[id] = ''; });
    }
    if (selectedOccupation !== 'Other') {
      data.occupation_other = '';
    }
  }

  if (currentStep === 4) {
    data.affiliations = [0, 1, 2].map(i => val(`affiliation_${i}`));
    data.volunteer_activities = [0, 1, 2].map(i => val(`volunteer_activity_${i}`));
  }

  if (currentStep === 5) {
    ['beneficiaries_name', 'beneficiaries_relationship', 'beneficiaries_contact', 'availability_other']
      .forEach(id => { data[id] = val(id); });
  }
}

function next() {
  if (!validateStep(true)) return;
  saveStep();
  if (currentStep < TOTAL_STEPS) { currentStep++; render(); }
  else { submitForm(); }
}

function bypassNext() {
  saveStep();
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    render();
  }
}

function back() {
  if (currentStep > 1) { saveStep(); currentStep--; render(); }
}

function renderStep1(c) {
  c.innerHTML = `
    <div class="step-label">Step 1 of 5</div>
    <div class="step-title">Volunteer Programs</div>
    <div class="step-desc">Select the program or programs you want to join.</div>

    <div class="field">
      <label>Volunteer Programs <span>*</span></label>
      ${checkGrid('programs', PROGRAMS)}
      <div class="err-msg" id="programs_err"></div>
    </div>

    <div class="btn-row">
      <div></div>
      <button class="btn btn-bypass" type="button" data-action="bypass-next">Bypass validation</button>
      <button class="btn btn-primary" type="button" data-action="next">Next</button>
    </div>
  `;

  bindCheckGroup('programs');
  updateStepButtons();
}

function renderStep2(c) {
  c.innerHTML = `
    <div class="step-label">Step 2 of 5</div>
    <div class="step-title">Personal Information</div>
    <div class="step-desc">Fill in your contact details and basic personal information.</div>

    <div class="row-3">
      <div class="field">
        <label>Last Name <span>*</span></label>
        <input id="last_name" type="text" value="${esc(data.last_name)}"/>
        <div class="err-msg" id="last_name_err"></div>
      </div>
      <div class="field">
        <label>First Name <span>*</span></label>
        <input id="first_name" type="text" value="${esc(data.first_name)}"/>
        <div class="err-msg" id="first_name_err"></div>
      </div>
      <div class="field">
        <label>Middle Name</label>
        <input id="middle_name" type="text" value="${esc(data.middle_name)}"/>
      </div>
    </div>

    <div class="field">
      <label>Address <span>*</span></label>
      <textarea id="address" rows="2">${esc(data.address)}</textarea>
      <div class="err-msg" id="address_err"></div>
    </div>

    <div class="section-title">Contact Information</div>
    <div class="row-3">
      <div class="field">
        <label>Mobile <span>*</span></label>
        <input id="mobile" type="tel" placeholder="09XX XXX XXXX" value="${esc(data.mobile)}"/>
        <div class="err-msg" id="mobile_err"></div>
      </div>
      <div class="field">
        <label>Telephone</label>
        <input id="telephone" type="tel" value="${esc(data.telephone)}"/>
      </div>
      <div class="field">
        <label>Email <span>*</span></label>
        <input id="email" type="email" value="${esc(data.email)}"/>
        <div class="err-msg" id="email_err"></div>
      </div>
    </div>

    <div class="row-4">
      <div class="field">
        <label>Birthday <span>*</span></label>
        <input id="birthday" type="date" value="${esc(data.birthday)}"/>
        <div class="err-msg" id="birthday_err"></div>
      </div>
      <div class="field">
        <label>Age <span>*</span></label>
        <input id="age" type="number" min="1" max="120" value="${esc(data.age)}"/>
        <div class="err-msg" id="age_err"></div>
      </div>
      <div class="field">
        <label>Civil Status <span>*</span></label>
        <select id="civil_status">
          <option value="">Select</option>
          ${optionList(CIVIL_STATUSES, data.civil_status)}
        </select>
        <div class="err-msg" id="civil_status_err"></div>
      </div>
      <div class="field">
        <label>Sex <span>*</span></label>
        <select id="sex">
          <option value="">Select</option>
          ${optionList(SEXES, data.sex)}
        </select>
        <div class="err-msg" id="sex_err"></div>
      </div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Blood Type <span>*</span></label>
        <select id="blood_type">
          <option value="">Select</option>
          ${optionList(BLOOD_TYPES, data.blood_type)}
        </select>
        <div class="err-msg" id="blood_type_err"></div>
      </div>
      <div class="field">
        <label>Religion <span>*</span></label>
        <input id="religion" type="text" value="${esc(data.religion)}"/>
        <div class="err-msg" id="religion_err"></div>
      </div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Any Existing Health Conditions? <span>*</span></label>
        <textarea id="health_conditions" rows="2">${esc(data.health_conditions)}</textarea>
        <div class="err-msg" id="health_conditions_err"></div>
      </div>
      <div class="field">
        <label>Any Food Restrictions? <span>*</span></label>
        <textarea id="food_restrictions" rows="2">${esc(data.food_restrictions)}</textarea>
        <div class="err-msg" id="food_restrictions_err"></div>
      </div>
    </div>

    <div class="field">
      <label>Special Skills / Hobbies <span>*</span></label>
      <textarea id="special_skills" rows="2">${esc(data.special_skills)}</textarea>
      <div class="err-msg" id="special_skills_err"></div>
    </div>

    <div class="row-2">
      <div class="field">
        <label>Are you an alumnus of UP? <span>*</span></label>
        <div class="choice-row" data-choice="alumnus_up">
          <button type="button" class="choice-btn ${data.alumnus_up === 'Yes' ? 'active' : ''}" data-choice-value="Yes">Yes</button>
          <button type="button" class="choice-btn ${data.alumnus_up === 'No' ? 'active' : ''}" data-choice-value="No">No</button>
        </div>
        <input id="alumnus_cu" class="mt-10" type="text" placeholder="If yes, specify constituent unit" value="${esc(data.alumnus_cu)}"/>
        <div class="err-msg" id="alumnus_cu_err"></div>
        <div class="err-msg" id="alumnus_up_err"></div>
      </div>
      <div class="field">
        <label>Are you presently connected with UP-PGH? <span>*</span></label>
        <div class="choice-row" data-choice="connected_pgh">
          <button type="button" class="choice-btn ${data.connected_pgh === 'Yes' ? 'active' : ''}" data-choice-value="Yes">Yes</button>
          <button type="button" class="choice-btn ${data.connected_pgh === 'No' ? 'active' : ''}" data-choice-value="No">No</button>
        </div>
        <input id="pgh_details" class="mt-10" type="text" placeholder="If yes, please specify" value="${esc(data.pgh_details)}"/>
        <div class="err-msg" id="pgh_details_err"></div>
        <div class="err-msg" id="connected_pgh_err"></div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-back" type="button" data-action="back">Back</button>
      <button class="btn btn-bypass" type="button" data-action="bypass-next">Bypass validation</button>
      <button class="btn btn-primary" type="button" data-action="next">Next</button>
    </div>
  `;

  bindInputs([
    'last_name', 'first_name', 'middle_name', 'address', 'mobile', 'telephone', 'email',
    'birthday', 'age', 'civil_status', 'sex', 'blood_type', 'religion',
    'health_conditions', 'food_restrictions', 'special_skills', 'alumnus_cu', 'pgh_details'
  ]);
  bindMobileFormatting();
  bindBirthdayAge();
  updateStepButtons();
}

function renderStep3(c) {
  const selectedOccupation = data.main_occupations[0] || '';
  const showLicensedFields = LICENSED_OCCUPATIONS.includes(selectedOccupation);
  const showStudentFields = selectedOccupation === 'Student';
  const showOtherField = selectedOccupation === 'Other';
  const occupationDetails = showLicensedFields ? `
    <div class="section-title">If Licensed, Please Complete</div>
    <div class="field">
      <label>License Status <span>*</span></label>
      <div class="choice-row" data-choice="licensed_status">
        ${LICENSED_STATUSES.map(item => `
          <button type="button" class="choice-btn ${data.licensed_status === item ? 'active' : ''}" data-choice-value="${esc(item)}">${esc(item)}</button>
        `).join('')}
      </div>
      <div class="err-msg" id="licensed_status_err"></div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>PRC License No. ${data.licensed_status === 'Intern / Trainee' ? '' : '<span>*</span>'}</label>
        <input id="prc_license" type="text" inputmode="numeric" maxlength="20" value="${esc(data.prc_license)}" ${data.licensed_status === 'Intern / Trainee' ? 'disabled placeholder="Not required for interns / trainees"' : ''}/>
        <div class="err-msg" id="prc_license_err"></div>
      </div>
      <div class="field">
        <label>Department / Ward / Office <span>*</span></label>
        <input id="department_office" type="text" value="${esc(data.department_office)}"/>
        <div class="err-msg" id="department_office_err"></div>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>Unit / Company <span>*</span></label>
        <input id="unit_company" type="text" value="${esc(data.unit_company)}"/>
        <div class="err-msg" id="unit_company_err"></div>
      </div>
      <div class="field">
        <label>Office Address <span>*</span></label>
        <input id="office_address" type="text" value="${esc(data.office_address)}"/>
        <div class="err-msg" id="office_address_err"></div>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>Tel / Fax Nos. <span>*</span></label>
        <input id="tel_fax_nos" type="text" value="${esc(data.tel_fax_nos)}"/>
        <div class="err-msg" id="tel_fax_nos_err"></div>
      </div>
      <div class="field">
        <label>Email Address <span>*</span></label>
        <input id="work_email" type="email" value="${esc(data.work_email)}"/>
        <div class="err-msg" id="work_email_err"></div>
      </div>
    </div>
    <div class="field">
      <label>Current Work Schedule <span>*</span></label>
      <input id="current_work_schedule" type="text" value="${esc(data.current_work_schedule)}"/>
      <div class="err-msg" id="current_work_schedule_err"></div>
    </div>
  ` : showStudentFields ? `
    <div class="section-title">If UP Student Only</div>
    <div class="row-2">
      <div class="field">
        <label>Student No. <span>*</span></label>
        <input id="student_no" type="text" value="${esc(data.student_no)}"/>
        <div class="err-msg" id="student_no_err"></div>
      </div>
      <div class="field">
        <label>Course <span>*</span></label>
        <input id="course" type="text" value="${esc(data.course)}"/>
        <div class="err-msg" id="course_err"></div>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>College <span>*</span></label>
        <input id="college" type="text" value="${esc(data.college)}"/>
        <div class="err-msg" id="college_err"></div>
      </div>
      <div class="field">
        <label>Year Level <span>*</span></label>
        <select id="year_level">
          <option value="">Select year level</option>
          ${optionList(YEAR_LEVELS, data.year_level)}
        </select>
        <div class="err-msg" id="year_level_err"></div>
      </div>
    </div>
  ` : showOtherField ? `
    <div class="field">
      <label>Please Specify <span>*</span></label>
      <input id="occupation_other" type="text" value="${esc(data.occupation_other)}"/>
      <div class="err-msg" id="occupation_other_err"></div>
    </div>
  ` : `
    <div class="notice-green">Select your main occupation to show the relevant details.</div>
  `;

  c.innerHTML = `
    <div class="step-label">Step 3 of 5</div>
    <div class="step-title">Occupational Details</div>
    <div class="step-desc">Choose your current occupation, then complete the matching section.</div>

    <div class="field">
      <label>Main Occupation <span>*</span></label>
      ${checkGrid('main_occupations', OCCUPATIONS)}
      <div class="err-msg" id="main_occupations_err"></div>
    </div>
    ${occupationDetails}

    <div class="btn-row">
      <button class="btn btn-back" type="button" data-action="back">Back</button>
      <button class="btn btn-bypass" type="button" data-action="bypass-next">Bypass validation</button>
      <button class="btn btn-primary" type="button" data-action="next">Next</button>
    </div>
  `;

  bindCheckGroup('main_occupations');
  bindInputs([
    'occupation_other', 'prc_license', 'department_office', 'unit_company', 'office_address',
    'tel_fax_nos', 'work_email', 'current_work_schedule', 'student_no', 'college', 'course', 'year_level'
  ]);
  updateStepButtons();
}

function renderStep4(c) {
  c.innerHTML = `
    <div class="step-label">Step 4 of 5</div>
    <div class="step-title">Affiliations and Activities</div>
    <div class="step-desc">List organizations and volunteer activities within or outside UP.</div>

    <div class="section-title">Affiliation / Membership in Organizations</div>
    ${[0, 1, 2].map(i => `
      <div class="field">
        <label>${i + 1}${i === 0 ? ' <span>*</span>' : ''}</label>
        <input id="affiliation_${i}" type="text" value="${esc(data.affiliations[i])}"/>
        <div class="err-msg" id="affiliation_${i}_err"></div>
      </div>
    `).join('')}

    <div class="section-title">Volunteer Activities</div>
    ${[0, 1, 2].map(i => `
      <div class="field">
        <label>${i + 1}${i === 0 ? ' <span>*</span>' : ''}</label>
        <input id="volunteer_activity_${i}" type="text" value="${esc(data.volunteer_activities[i])}"/>
        <div class="err-msg" id="volunteer_activity_${i}_err"></div>
      </div>
    `).join('')}

    <div class="btn-row">
      <button class="btn btn-back" type="button" data-action="back">Back</button>
      <button class="btn btn-bypass" type="button" data-action="bypass-next">Bypass validation</button>
      <button class="btn btn-primary" type="button" data-action="next">Next</button>
    </div>
  `;

  bindInputs([
    'affiliation_0', 'affiliation_1', 'affiliation_2',
    'volunteer_activity_0', 'volunteer_activity_1', 'volunteer_activity_2'
  ]);
  updateStepButtons();
}

function renderStep5(c) {
  c.innerHTML = `
    <div class="step-label">Step 5 of 5</div>
    <div class="step-title">Emergency and Deployment</div>
    <div class="step-desc">For insurance purposes and deployment planning during Pahinungod activities outside UP-PGH.</div>

    <div class="section-title">Beneficiary Details</div>
    <div class="field">
      <label>Name of Beneficiary / Beneficiaries <span>*</span></label>
      <textarea id="beneficiaries_name" rows="2">${esc(data.beneficiaries_name)}</textarea>
      <div class="err-msg" id="beneficiaries_name_err"></div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>Relationship/s <span>*</span></label>
        <input id="beneficiaries_relationship" type="text" value="${esc(data.beneficiaries_relationship)}"/>
        <div class="err-msg" id="beneficiaries_relationship_err"></div>
      </div>
      <div class="field">
        <label>Contact Number/s <span>*</span></label>
        <input id="beneficiaries_contact" type="text" value="${esc(data.beneficiaries_contact)}"/>
        <div class="err-msg" id="beneficiaries_contact_err"></div>
      </div>
    </div>

    <div class="field">
      <label>Available Time for Deployment <span>*</span></label>
      <div class="choice-row" data-choice="availability">
        ${AVAILABILITY.map(item => `
          <button type="button" class="choice-btn ${data.availability === item ? 'active' : ''}" data-choice-value="${esc(item)}">${esc(item)}</button>
        `).join('')}
      </div>
      <div class="err-msg" id="availability_err"></div>
    </div>
    <div class="field">
      <label>Others ${data.availability === 'Others' ? '<span>*</span>' : ''}</label>
      <input id="availability_other" type="text" value="${esc(data.availability_other)}"/>
      <div class="err-msg" id="availability_other_err"></div>
    </div>

    <div class="global-err" id="submit_err"></div>
    <div class="btn-row">
      <button class="btn btn-back" type="button" data-action="back">Back</button>
      <button class="btn btn-submit" id="submitBtn" type="button" data-action="next">Submit Registration</button>
    </div>
  `;

  bindInputs(['beneficiaries_name', 'beneficiaries_relationship', 'beneficiaries_contact', 'availability_other']);
  updateStepButtons();
}

function bindInputs(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, () => {
      clearErr(id);
      updateStepButtons();
    });
  });
}

function bindCheckGroup(key) {
  const group = document.querySelector(`[data-check-group="${key}"]`);
  if (!group) return;

  group.addEventListener('change', e => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;

    const value = input.value;
    if (key === 'main_occupations') {
      saveStep();
      data[key] = input.checked ? [value] : [];
      render();
      return;
    }

    if (input.checked && !data[key].includes(value)) data[key].push(value);
    if (!input.checked) data[key] = data[key].filter(item => item !== value);

    input.closest('.check-item')?.classList.toggle('active', input.checked);
    clearErr(key);
    updateStepButtons();
  });
}

function bindMobileFormatting() {
  const mobileEl = document.getElementById('mobile');
  if (mobileEl) {
    mobileEl.addEventListener('input', () => {
      mobileEl.value = mobileEl.value.replace(/[^\d\s]/g, '').slice(0, 13);
    });
  }
}

function bindBirthdayAge() {
  const birthday = document.getElementById('birthday');
  const age = document.getElementById('age');
  if (!birthday || !age) return;

  birthday.addEventListener('change', () => {
    if (!birthday.value) return;
    const birthDate = new Date(birthday.value);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) computedAge--;
    if (computedAge > 0 && computedAge < 130) age.value = String(computedAge);
  });
}

async function submitForm() {
  const btn = document.getElementById('submitBtn');
  const errBox = document.getElementById('submit_err');
  if (!validateStep(true)) return;
  saveStep();

  btn.disabled = true;
  btn.textContent = 'Submitting...';
  errBox.classList.remove('show');

  const fullName = [data.last_name, data.first_name, data.middle_name].filter(Boolean).join(', ');
  const occupation = [
    ...data.main_occupations.filter(item => item !== 'Other'),
    data.occupation_other || (data.main_occupations.includes('Other') ? 'Other' : '')
  ].filter(Boolean).join(', ') || 'Not specified';

  const payload = {
    program: data.programs.join(', '),
    full_name: fullName,
    mobile: data.mobile,
    email: data.email,
    alumnus_up: data.alumnus_up,
    connected_pgh: data.connected_pgh,
    occupation,
    year_joined: currentYear,
    prc_license: data.prc_license,
    department_office: [
      data.department_office,
      data.unit_company && `Unit/Company: ${data.unit_company}`,
      data.office_address && `Office: ${data.office_address}`,
      data.tel_fax_nos && `Tel/Fax: ${data.tel_fax_nos}`,
      data.work_email && `Work Email: ${data.work_email}`,
      data.current_work_schedule && `Schedule: ${data.current_work_schedule}`
    ].filter(Boolean).join(' | '),
    college: data.college,
    course: data.course,
    year_level: data.year_level,
    volunteer_data: {
      address: data.address,
      telephone: data.telephone,
      birthday: data.birthday,
      age: data.age,
      civil_status: data.civil_status,
      sex: data.sex,
      blood_type: data.blood_type,
      religion: data.religion,
      health_conditions: data.health_conditions,
      food_restrictions: data.food_restrictions,
      special_skills: data.special_skills,
      alumnus_cu: data.alumnus_cu,
      pgh_details: data.pgh_details,
      licensed_status: data.licensed_status,
      student_no: data.student_no,
      affiliations: data.affiliations,
      volunteer_activities: data.volunteer_activities,
      beneficiaries_name: data.beneficiaries_name,
      beneficiaries_relationship: data.beneficiaries_relationship,
      beneficiaries_contact: data.beneficiaries_contact,
      availability: data.availability,
      availability_other: data.availability_other
    }
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
    data[k] = Array.isArray(data[k]) ? (k === 'affiliations' || k === 'volunteer_activities' ? ['', '', ''] : []) : '';
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
