// HustleHub - vanilla JS + Supabase
// IMPORTANT: set your Supabase credentials in .env on deployment or replace here.
// For local quick start you can paste SUPABASE_URL and SUPABASE_ANON_KEY in the env variables on Vercel.
const SUPABASE_URL = 'https://vtniroesqjcnyzxifzdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmlyb2VzcWpjbnl6eGlmemRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzExNTMsImV4cCI6MjA3NTE0NzE1M30.hGlLVeHrA5sEnUCZK7xIRuQ1SDpVsL681S20VyzyPaI';

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple client-side router
const views = {
  home: document.getElementById('view-home'),
  market: document.getElementById('view-market'),
  jobs: document.getElementById('view-jobs'),
  post: document.getElementById('view-post'),
  dashboard: document.getElementById('view-dashboard'),
  auth: document.getElementById('view-auth')
};

function show(view) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  if (views[view]) views[view].classList.add('active');
  if (view === 'home') loadLatest();
  if (view === 'market') loadMarketplace();
  if (view === 'jobs') loadJobs();
  if (view === 'dashboard') loadDashboard();
}

// nav buttons
document.getElementById('nav-home').onclick = () => show('home');
document.getElementById('nav-market').onclick = () => show('market');
document.getElementById('nav-jobs').onclick = () => show('jobs');
document.getElementById('nav-new').onclick = () => show('post');
document.getElementById('nav-dashboard').onclick = () => show('dashboard');
document.getElementById('nav-login').onclick = () => show('auth');
document.getElementById('nav-logout').onclick = signOut;

// Forms
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const name = document.getElementById('reg-name').value.trim();
  const { user, error } = await supabase.auth.signUp({ email, password }, { data: { full_name: name } });
  if (error) return showAuthMsg(error.message);
  showAuthMsg('Check your email to confirm. Profile will be created automatically.');
});

document.getElementById('form-login').addEventListener('submit', async (e)=> {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { user, error } = await supabase.auth.signIn({ email, password });
  if (error) return showAuthMsg(error.message);
  showAuthMsg('Signed in successfully');
  refreshAuth();
  show('dashboard');
});

document.getElementById('form-post').addEventListener('submit', async (e)=> {
  e.preventDefault();
  const type = document.getElementById('post-type').value;
  const title = document.getElementById('post-title').value.trim();
  const description = document.getElementById('post-desc').value.trim();
  const price = document.getElementById('post-price').value || null;
  const fileInput = document.getElementById('post-image');
  const user = supabase.auth.user();
  if (!user) return document.getElementById('post-result').innerText = 'Please sign in first.';
  let image_url = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('public').upload(filePath, file);
    if (upErr) {
      console.error(upErr);
      document.getElementById('post-result').innerText = 'Image upload failed.';
      return;
    }
    image_url = `${SUPABASE_URL}/storage/v1/object/public/public/${filePath}`;
  }
  const { error } = await supabase.from('listings').insert([{
    user_id: user.id,
    title,
    description,
    price,
    image_url,
    kind: type,
    created_at: new Date().toISOString()
  }]);
  if (error) {
    document.getElementById('post-result').innerText = 'Publish failed: ' + error.message;
    return;
  }
  document.getElementById('post-result').innerText = 'Published ✔';
  document.getElementById('form-post').reset();
  // refresh lists
  loadMarketplace();
  loadJobs();
  loadDashboard();
});

// Auth state
supabase.auth.onAuthStateChange((event, session) => {
  refreshAuth();
});

async function refreshAuth() {
  const user = supabase.auth.user();
  if (user) {
    document.getElementById('nav-login').style.display = 'none';
    document.getElementById('nav-logout').style.display = 'inline-block';
    document.getElementById('user-info').innerText = `Signed in as ${user.email}`;
  } else {
    document.getElementById('nav-login').style.display = 'inline-block';
    document.getElementById('nav-logout').style.display = 'none';
    document.getElementById('user-info').innerText = 'Not signed in';
  }
}

// Sign out
async function signOut() {
  await supabase.auth.signOut();
  refreshAuth();
  show('home');
}

// Helpers to show messages
function showAuthMsg(msg) {
  document.getElementById('auth-msg').innerText = msg;
}

// Load latest for home
async function loadLatest() {
  const container = document.getElementById('latest-cards');
  container.innerHTML = '';
  const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(6);
  if (error) return console.error(error);
  data.forEach(renderCard(container));
}

// Load marketplace (items)
function renderCard(container) {
  return (item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${item.image_url ? `<img src="${item.image_url}" alt="img">` : ''}
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.description || '')}</p>
      <p><strong>Price:</strong> ${item.price ? '$' + item.price : 'Negotiable'}</p>
      <small>Posted: ${new Date(item.created_at).toLocaleString()}</small>
      <div style="margin-top:8px">
        <button data-id="${item.id}" class="btn-contact">Contact</button>
        <button data-id="${item.id}" class="btn-like">Save</button>
      </div>
    `;
    container.appendChild(card);
    card.querySelector('.btn-contact').onclick = () => contactSeller(item);
    card.querySelector('.btn-like').onclick = () => saveListing(item);
  };
}

async function contactSeller(item) {
  const user = supabase.auth.user();
  if (!user) return alert('Sign in to contact seller');
  // create simple message thread row in messages table
  const { error } = await supabase.from('messages').insert([{
    listing_id: item.id,
    sender_id: user.id,
    receiver_id: item.user_id,
    content: `Hi! I'm interested in "${item.title}".`
  }]);
  if (error) return alert('Failed to send message: ' + error.message);
  alert('Message sent to seller (they will see it in their dashboard).');
}

async function saveListing(item) {
  const user = supabase.auth.user();
  if (!user) return alert('Sign in to save');
  const { error } = await supabase.from('saves').insert([{ user_id: user.id, listing_id: item.id }]);
  if (error) return alert('Save failed: ' + error.message);
  alert('Saved ✔');
}

async function loadMarketplace() {
  const container = document.getElementById('market-items');
  container.innerHTML = '';
  const { data, error } = await supabase.from('listings').select('*').eq('kind','item').order('created_at', { ascending: false });
  if (error) return console.error(error);
  data.forEach(renderCard(container));
}

async function loadJobs() {
  const container = document.getElementById('job-list');
  container.innerHTML = '';
  const { data, error } = await supabase.from('listings').select('*').eq('kind','job').order('created_at', { ascending: false });
  if (error) return console.error(error);
  data.forEach(renderCard(container));
}

async function loadDashboard() {
  const user = supabase.auth.user();
  if (!user) { document.getElementById('user-listings').innerHTML = '<p>Please sign in to see your dashboard.'; return; }
  const { data, error } = await supabase.from('listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return console.error(error);
  const container = document.getElementById('user-listings');
  container.innerHTML = '';
  data.forEach(item => {
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      ${item.image_url ? `<img src="${item.image_url}" alt="img">` : ''}
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.description)}</p>
      <div style="margin-top:8px">
        <button data-id="${item.id}" class="btn-edit">Edit</button>
        <button data-id="${item.id}" class="btn-del">Delete</button>
      </div>
    `;
    container.appendChild(card);
    card.querySelector('.btn-del').onclick = async ()=> {
      if (!confirm('Delete this listing?')) return;
      const { error } = await supabase.from('listings').delete().eq('id', item.id);
      if (error) return alert('Delete failed: '+error.message);
      loadDashboard();
    };
    card.querySelector('.btn-edit').onclick = ()=> {
      // populate post form for edit (simple)
      show('post');
      document.getElementById('post-type').value = item.kind;
      document.getElementById('post-title').value = item.title;
      document.getElementById('post-desc').value = item.description;
      document.getElementById('post-price').value = item.price || '';
      // Deleting original and user will republish as new
      // In production implement update flow (upsert)
    };
  });
}

// Simple escaping
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

// Realtime subscription for new listings
supabase.from('listings').on('INSERT', payload => {
  // Prepend to lists
  loadLatest();
  loadMarketplace();
  loadJobs();
}).subscribe();

// initial view
refreshAuth();
show('home');
