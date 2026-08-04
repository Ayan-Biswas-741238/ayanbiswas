const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRfMneYdHjhaFyrDH8DDK7pHNwFE7TggeHzy8KeG9J5UPa6kMWU3n_0wIBIAYTfqLixnRgEIQrkwLT/pub?output=csv';
        
let galleryData = { personal: [], published: [], favorites: [] };
const MAX_CARDS = 6;

function extractDriveId(link) {
    if (!link) return null;
    let match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    match = link.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return link.trim();
}

async function initFromSheet() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const text = await response.text();
        const rows = text.split('\n').map(row => row.split(','));
        
        if(rows.length > 0) {
            const headers = rows[0].map(h => h.trim().toLowerCase());
            const pIdx = headers.indexOf('personal');
            const pubIdx = headers.indexOf('published');
            const favIdx = headers.indexOf('favorite');
            const profIdx = headers.indexOf('profile');

            let profileId = null;

            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i];
                if (!cols || cols.length === 0) continue;
                if (pIdx > -1 && cols[pIdx] && cols[pIdx].trim()) {
                    let id = extractDriveId(cols[pIdx]);
                    if (id) galleryData.personal.push(id);
                }
                if (pubIdx > -1 && cols[pubIdx] && cols[pubIdx].trim()) {
                    let id = extractDriveId(cols[pubIdx]);
                    if (id) galleryData.published.push(id);
                }
                if (favIdx > -1 && cols[favIdx] && cols[favIdx].trim()) {
                    let id = extractDriveId(cols[favIdx]);
                    if (id) galleryData.favorites.push(id);
                }
                if (profIdx > -1 && cols[profIdx] && cols[profIdx].trim() && !profileId) {
                    profileId = extractDriveId(cols[profIdx]);
                }
            }

            const profileImg = document.getElementById('profile-img');
            const profileFallback = document.getElementById('profile-fallback');
            if (profileImg && profileFallback) {
                if (profileId) {
                    profileImg.src = `https://drive.google.com/thumbnail?id=${profileId}&sz=w300`;
                    profileImg.style.display = 'block';
                    profileFallback.style.display = 'none';
                } else {
                    profileImg.style.display = 'none';
                    profileFallback.style.display = 'flex';
                }
            }
        }
    } catch (error) {
        console.error("Error fetching Google Sheet:", error);
        const profileImg = document.getElementById('profile-img');
        const profileFallback = document.getElementById('profile-fallback');
        if(profileImg && profileFallback){
            profileImg.style.display = 'none';
            profileFallback.style.display = 'flex';
        }
    }

    loadRecentPhotos();
    loadAllGalleries();
}

function loadRecentPhotos() {
    const grid = document.getElementById('recentGrid');
    if (!grid) return; 
    grid.innerHTML = '';
    const allPhotos = [...galleryData.personal, ...galleryData.published, ...galleryData.favorites];

    allPhotos.slice(0, 4).forEach((photoId) => { 
        const card = document.createElement('div');
        card.className = 'recent-card visible';
        card.onclick = function() { window.location.href = 'gallery.html'; };

        const img = document.createElement('img');
        img.src = `https://drive.google.com/thumbnail?id=${photoId}&sz=w300`;
        img.alt = 'Recent Photo';
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23dbeafe" width="300" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%232563eb" font-size="14">Photo</text></svg>`;
        };

        card.appendChild(img);
        grid.appendChild(card);
    });
}

function createPhotoCard(photoId, caption) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.onclick = function() { openLightbox(`https://drive.google.com/thumbnail?id=${photoId}&sz=w800`, caption); };

    const img = document.createElement('img');
    img.src = `https://drive.google.com/thumbnail?id=${photoId}&sz=w400`;
    img.alt = caption;
    img.loading = 'lazy';
    img.onerror = function() {
        this.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23dbeafe" width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%232563eb" font-size="16">Photo</text></svg>`;
    };
    card.appendChild(img);
    return card;
}

function createPlaceholderCard() {
    const card = document.createElement('div');
    card.className = 'gallery-card placeholder';
    card.innerHTML = `<div class="placeholder-content"><i class="fas fa-image"></i><span>Coming Soon</span></div>`;
    return card;
}

function loadGalleryTab(tabName, gridId) {
    const grid = document.getElementById(gridId);
    if(!grid) return;
    grid.innerHTML = '';
    const photos = galleryData[tabName] || [];

    photos.forEach(photoId => { grid.appendChild(createPhotoCard(photoId, tabName.charAt(0).toUpperCase() + tabName.slice(1))); });
    const remaining = MAX_CARDS - photos.length;
    for (let i = 0; i < (remaining > 0 ? remaining : 0); i++) { grid.appendChild(createPlaceholderCard()); }
}

function loadAllGalleries() {
    if (!document.getElementById('grid-personal')) return;
    loadGalleryTab('personal', 'grid-personal');
    loadGalleryTab('published', 'grid-published');
    loadGalleryTab('favorites', 'grid-favorites');
}

function switchTab(tab,btn){
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.gallery-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('tab-'+tab).classList.add('active');
}

function openLightbox(src,caption){
    const lightbox = document.getElementById('lightbox');
    if(!lightbox) return;
    document.getElementById('lightbox-img').src=src;
    document.getElementById('lightbox-caption').textContent=caption;
    lightbox.classList.add('active');
    document.body.style.overflow='hidden';
}

function closeLightbox(){
    const lightbox = document.getElementById('lightbox');
    if(!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow='';
}

document.addEventListener('keydown',e=>{if(e.key==='Escape') closeLightbox();});
window.addEventListener('scroll',()=>{ document.getElementById('navbar').classList.toggle('scrolled',window.scrollY>10); });
document.addEventListener('DOMContentLoaded', initFromSheet);
