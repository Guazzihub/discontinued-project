// public/scripts.js

// Reservation handler
function handleReservation(itemId, action, successMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  fetch(`/items/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
    signal: controller.signal
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(successMessage);
      window.location.reload(); // Reload on success
    } else {
      alert(data.message || 'Processing Error');
    }
  })
  .catch(err => {
    if (err.name === 'AbortError') {
      alert('Request timeout');
    } else {
      console.error('Request Error:', err);
      alert('Processing Error');
    }
  })
  .finally(() => clearTimeout(timeoutId));
}

// Reservation and Remove Reservation handlers
function initializeReservationHandlers() {
  document.querySelectorAll('.reservation-btn').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const itemId = button.dataset.id;
      if (confirm('Do you want to confirm your reservation?')) {
        handleReservation(itemId, 'reserve', 'Successfully reserved');
      }
    });
  });

  document.querySelectorAll('.cancel-btn').forEach(button => {
    button.addEventListener('click', () => {
      const reservationId = button.dataset.id;
      if (confirm('Do you want to cancel your reservation?')) {
        handleReservation(reservationId, 'remove-reservation', 'Reservation Removed');
      }
    });
  });
}

// Open modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Modal settings handlers
function initializeModalHandlers() {
  document.querySelectorAll('[data-modal-open]').forEach(button => {
    button.addEventListener('click', () => openModal(button.dataset.modalOpen));
  });

  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.modalClose));
  });
}
// Edit and Delete filter handlers
function handleFilterAction(filterId, action, newFilterName = null, successMessage) {
  const payload = { filterId, action };
  if (newFilterName) payload.newFilterName = newFilterName;

  fetch('/filters/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(successMessage);
        location.reload();
      } else {
        alert(data.message || 'Error: Action Failed.');
      }
    })
    .catch(err => console.error('Error: Action Failed:', err));
}

function initializeFilterHandlers() {
  document.getElementById('save-filter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const filterName = document.getElementById('filterName').value;
    const filters = {}; // Store filters

    fetch('/filters/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filterName, filters })
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          alert(data.message);
          location.reload();
        } else {
          alert('Error to save filter.');
        }
      })
      .catch(err => console.error('Error to save filter:', err));
  });

  document.getElementById('edit-filter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const filterId = document.getElementById('savedFilters').value;
    const newFilterName = document.getElementById('filterName').value;

    if (newFilterName) {
      handleFilterAction(filterId, 'rename', newFilterName, 'Filter renamed successfully!');
    }
  });

  document.getElementById('delete-filter-btn')?.addEventListener('click', () => {
    const filterId = document.getElementById('savedFilters').value;

    if (confirm('Do you wish to remove this filter?')) {
      handleFilterAction(filterId, 'delete', null, 'Filter removed successfully!');
    }
  });
}

// Infinite Scroll
function initializeInfiniteScroll() {
  let page = 1;
  const loadingElement = document.getElementById('loading');
  const itemstable = document.querySelector('#items-table tbody');

  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
      page++;
      loadingElement.style.display = 'block';

      fetch(`/items/load-more?page=${page}`)
        .then(response => response.json())
        .then(data => {
          loadingElement.style.display = 'none';
          itemstable.insertAdjacentHTML('beforeend', data.html);
        })
        .catch(err => {
          console.error('Error: items could not be loaded:', err);
          loadingElement.style.display = 'none';
        });
    }
  });
}

function initializeStarFilter() {
  document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', () => {
          const score = star.dataset.value;
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('score');
          
          // Add new filter
          currentUrl.searchParams.set('score', score);
          
          window.location.href = currentUrl.toString();
      });
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeReservationHandlers();
  initializeModalHandlers();
  initializeFilterHandlers();
  initializeInfiniteScroll();
  initializeStarFilter();
});

document.addEventListener('DOMContentLoaded', () => {
  const userProfile = document.getElementById('user-profile');
  const dropdownMenu = document.getElementById('dropdown-menu');

  userProfile.addEventListener('click', () => {
    const isVisible = dropdownMenu.style.display === 'block';
    dropdownMenu.style.display = isVisible ? 'none' : 'block';
  });

  // Corrigir para contains
  document.addEventListener('click', (event) => {
    if (!userProfile.contains(event.target)) {
      dropdownMenu.style.display = 'none';
    }
  });
});

