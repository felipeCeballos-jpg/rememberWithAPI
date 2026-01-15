import {
  initLanguage,
  checkLoaded,
  updateDesign,
  setLanguage,
  booksAnimation,
  initMessages,
  sendMessage,
  loadMoreMessages,
  initFormValidation,
  validateField,
  validateSticker,
  clearStickerError,
  sideElementsAnimation,
  getMessages,
  paginationPage,
  validatedEmail,
  initModalDescriptionImg,
  subscribeToNewsletter,
} from './util.js';

const switchLanguageButton = document.querySelector('.language-button');
const html = document.querySelector('html');
const messageForm = document.querySelector('.form-container');
const stickers = document.querySelectorAll('.sticker-button');
const stickersInput = document.querySelector('.stickers-input');
const hiddenStickerInput = document.querySelector('#selectedsticker');
const messageContainer = document.querySelector('.msgs-container');
const ALLOWED_STICKERS = new Set(['candy', 'candle', 'flower', 'bear']);
const modal = document.querySelector('#modal-subscribe');
const modalForm = document.querySelector('.modal-form-content');

let selectedBtn = null;

// Set media queries
const mqlMobile = window.matchMedia('(max-width: 800px)');
const mqlDefault = window.matchMedia('(min-width: 801px)');

// Set the loader element
const loader = document.querySelector('.loader');

// Set Language
initLanguage(html);

const startLoadingTime = Date.now();
window.addEventListener('load', () => {
  checkLoaded(startLoadingTime, loader, true, null, 'default');
});

window.addEventListener('DOMContentLoaded', async () => {
  updateDesign(mqlMobile.matches);
  initModalDescriptionImg(html.lang, mqlMobile.matches);
  const canOpenModal = localStorage.getItem('canOpenModal');

  if (!canOpenModal || canOpenModal === 'true') {
    setTimeout(() => {
      modal.classList.add('modal-visible');
      localStorage.setItem('canOpenModal', 'true');
    }, 10000);
  }

  let messages = await getMessages();
  initFormValidation(html.lang, mqlMobile.matches);
  sideElementsAnimation();
  booksAnimation();

  if (messages.success) {
    const pagination = {
      currentPage: messages.data.current_page,
      lastPage: messages.data.last_page,
      total: messages.data.total,
    };

    initMessages(messageContainer, messages.data.data, pagination);
  }
});

switchLanguageButton.addEventListener('click', () => {
  loader.style.display = 'flex';

  // Change Language
  setLanguage(html);

  updateDesign(mqlMobile.matches).then((result) => {
    checkLoaded(result.timestamp, loader, true, null, 'default');
  });

  initFormValidation(html.lang);

  sideElementsAnimation();
  booksAnimation();
});

mqlMobile.addEventListener('change', (event) => {
  if (!event.matches) return;
  loader.style.display = 'flex';

  initModalDescriptionImg(html.lang, event.matches);

  updateDesign(event.matches).then((result) => {
    checkLoaded(result.timestamp, loader, false, null, 'default');
  });

  sideElementsAnimation();
  booksAnimation();
});

mqlDefault.addEventListener('change', (event) => {
  if (!event.matches) return;
  loader.style.display = 'flex';

  const element = document.querySelector('.modal-description-img');

  if (element) {
    element.remove();
  }

  updateDesign(event.matches).then((result) => {
    checkLoaded(result.timestamp, loader, false, null, 'default');
  });

  sideElementsAnimation();
  booksAnimation();
});

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#Name');
  const message = document.querySelector('#Message');
  const sticker = document.querySelector('#selectedsticker');
  const stickersContainer = document.querySelector('.stickers-input');
  const loaderImage = document.querySelector('.loader-img');
  const scrollPosition = window.scrollY;

  // Validate all fields and show errors
  const isNameValid = validateField(name, html.lang);
  const isMessageValid = validateField(message, html.lang);
  const isStickerValid = validateSticker(sticker, stickersContainer);

  if (!isNameValid || !isMessageValid || !isStickerValid) {
    return;
  }

  const newMessage = {
    name: name.value,
    description: message.value,
    sticker: sticker.value,
  };
  loader.style.display = 'flex';
  loaderImage.src =
    html.lang === 'ru'
      ? './assets/form-loader-ru.GIF'
      : './assets/form-loader-en.GIF';

  const startMessageLoadingTime = Date.now();

  sendMessage(messageContainer, newMessage)
    .then(() => {
      name.value = '';
      message.value = '';
      sticker.value = '';
      clearStickersSelection(stickersContainer);
    })
    .finally(() => {
      const elapsed = Date.now() - startMessageLoadingTime;
      const time = html.lang === 'ru' ? 4100 : 4400;
      const remainingTime = Math.max(0, time - elapsed);

      setTimeout(() => {
        loader.style.display = 'none';
        loaderImage.src = './assets/loading.GIF';
      }, remainingTime);
    });

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPosition);
  });
});

modalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const modalFormLoader = document.querySelector('.modal-form-loader');
  const email = document.querySelector('#modal-form-email');
  const isEmailValid = await validatedEmail(email, html.lang);

  if (!isEmailValid) {
    email.value = '';
    return;
  }

  modalFormLoader.classList.add('active-modal-form-loader');
  modalFormLoader.classList.remove('inactive-modal-form-loader');

  const element = document.querySelector('.modal-response');
  const message = document.createElement('img');
  let isSuccess = false;

  try {
    const response = await subscribeToNewsletter(email.value);

    if (!response.success) {
     let imageSrc =
          html.lang === 'ru'
            ? './assets/fail-ru.webp'
            : './assets/fail-en.webp';
        message.src = imageSrc;
        message.alt = 'Error sending email';
        message.classList.add('modal-response-img', 'error-email-response');
        element.appendChild(message); 
        isSuccess = false;
    } else {
      let imageSrc =
      html.lang === 'ru'
          ? './assets/success-ru.webp'
          : './assets/success-en.webp';
      message.src = imageSrc;
      message.alt = 'Success sent email';
      message.classList.add('modal-response-img', 'success-email-response');
      element.appendChild(message);
      isSuccess = true;
    }
  } catch (error) {
    isSuccess = false;
    console.log({ error });
  }
  finally {
    message.decode()
    .then(() => {
      email.value = '';
      modalFormLoader.classList.remove('active-modal-form-loader');
      modalFormLoader.classList.add('inactive-modal-form-loader');
      
      setTimeout(() => {
        if (isSuccess) {
          localStorage.setItem('canOpenModal', 'false');
          modal.classList.remove('modal-visible');
        }
      }, 2500);
    })
    .catch(() => {
        // Error loading image
    });
  }
});

function clearStickersSelection(container) {
  container.querySelectorAll('.sticker-button').forEach((item) => {
    selectedBtn = null;
    toggleButtonImages(item, false);
  });
}

stickersInput.addEventListener('click', (e) => {
  const btn = e.target.closest('.sticker-button');
  if (!btn || !ALLOWED_STICKERS.has(btn.dataset.value)) return;

  // 1. Clear previously-selected visual state (if any)
  if (selectedBtn) toggleButtonImages(selectedBtn, false);

  // 2. Apply visual “selected” state to the newly clicked button
  toggleButtonImages(btn, true);
  selectedBtn = btn;

  // 3. Persist value & clear validation error
  hiddenStickerInput.value = btn.dataset.value;
  clearStickerError(stickersInput);
});

/* HOVER */
stickersInput.addEventListener('pointerover', (e) => {
  const btn = e.target.closest('.sticker-button');
  if (!btn || btn === selectedBtn) return; // ignore if already selected
  toggleButtonImages(btn, true);
});

stickersInput.addEventListener('pointerout', (e) => {
  const btn = e.target.closest('.sticker-button');
  if (!btn || btn === selectedBtn) return;
  toggleButtonImages(btn, false);
});

/* HELPER ──────────────────────────────────────────────────────────── */
function toggleButtonImages(button, showHoverVersion) {
  const init = button.querySelector('.init-sticker');
  const hover = button.querySelector('.hover-sticker');

  init.style.display = showHoverVersion ? 'none' : 'block';
  hover.style.display = showHoverVersion ? 'block' : 'none';

  init.classList.toggle('selected-sticker', showHoverVersion);
  hover.classList.toggle('selected-sticker', showHoverVersion);
}

/* stickers.forEach((sticker) => {
  sticker.addEventListener('click', () => {
    const sticker_imgs = document.querySelectorAll('.sticker');
    const stickersContainer = document.querySelector('.stickers-input');

    // remove selection from all
    sticker_imgs.forEach((s) => s.classList.remove('selected-sticker'));

    // mark this as selected
    sticker_imgs.forEach((s) => {
      const splitText = s.alt.split(' ');
      if (sticker.dataset.value === splitText[0]) {
        s.classList.add('selected-sticker');
      }
    });

    if (
      sticker.dataset.value === 'bear' ||
      sticker.dataset.value === 'flower' ||
      sticker.dataset.value === 'candy' ||
      sticker.dataset.value === 'candle'
    ) {
      // store value in hidden input
      hiddenStickerInput.value = sticker.dataset.value;

      // Clear any existing sticker validation error
      clearStickerError(stickersContainer);
      return;
    }

    alert(
      `Please don't change the sticker value on the inspector, please refresh the page`
    );
  });
});
*/

document.addEventListener('click', async (e) => {
  if (e.target.closest('.load-more-msg-button')) {
    try {
      const response = await getMessages(paginationPage);
      const scrollPosition = window.scrollY;

      if (!response.success) {
        throw Error('Something went wrong');
      }

      const pagination = {
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
      };

      loadMoreMessages(messageContainer, response.data.data, pagination);

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (error) {
      console.log({ error });
    }
  }

  if (e.target === modal) {
    localStorage.setItem('canOpenModal', 'false');
    modal.classList.remove('modal-visible');
  }
});
