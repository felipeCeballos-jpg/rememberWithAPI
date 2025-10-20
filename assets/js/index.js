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
} from './util.js';

const switchLanguageButton = document.querySelector('.language-button');
const html = document.querySelector('html');
const form = document.querySelector('.form-container');
const stickers = document.querySelectorAll('.sticker-button');
const hiddenStickerInput = document.querySelector('#selectedsticker');
const messageContainer = document.querySelector('.msgs-container');

// Set media queries
const mqlMobile = window.matchMedia('(max-width: 800px)');
const mqlDefault = window.matchMedia('(min-width: 801px)');

// Set the loader element
const loader = document.querySelector('.loader');

// Set Language
initLanguage(html);

const startLoadingTime = Date.now();
window.addEventListener('load', () => {
  checkLoaded(startLoadingTime, loader, true); // TODO: Fix the body scroll when the page is loading
});

window.addEventListener('DOMContentLoaded', async () => {
  updateDesign(mqlMobile.matches);

  let messages = await getMessages();
  initFormValidation(html.lang);
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
    checkLoaded(result.timestamp, loader, true);
  });

  initFormValidation(html.lang);

  sideElementsAnimation();
  booksAnimation();
});

mqlMobile.addEventListener('change', (event) => {
  if (!event.matches) return;
  loader.style.display = 'flex';

  updateDesign(event.matches).then((result) => {
    checkLoaded(result.timestamp, loader);
  });

  sideElementsAnimation();
  booksAnimation();
});

mqlDefault.addEventListener('change', (event) => {
  if (!event.matches) return;
  loader.style.display = 'flex';

  updateDesign(event.matches).then((result) => {
    checkLoaded(result.timestamp, loader);
  });

  sideElementsAnimation();
  booksAnimation();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#Name');
  const message = document.querySelector('#Message');
  const sticker = document.querySelector('#selectedsticker');
  const stickersContainer = document.querySelector('.stickers-input');
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

  sendMessage(messageContainer, newMessage).then(() => {
    name.value = '';
    message.value = '';
    sticker.value = '';
  });

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPosition);
  });
});

stickers.forEach((sticker) => {
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
      sticker.dataset.value === 'candy'
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

document.addEventListener('click', async (e) => {
  if (e.target.closest('.load-more-msg-button')) {
    try {
      const response = await getMessages(paginationPage);
      const scrollPosition = window.scrollY;

      if (!response.success) {
        throw Error('Something went wrong');
      }

      loadMoreMessages(
        messageContainer,
        response.data.data,
        response.data.current_page === response.data.last_page
      );

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (error) {
      console.log({ error });
    }
  }
});
