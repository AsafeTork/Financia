# VALIDATOR-5: Focus Trap Fault Analysis — `Confirm.jsx`

**Validator:** VALIDATOR-5  
**Target:** `src/shared/ui/Confirm.jsx`  
**Date:** 2026-07-21  
**Type:** REPORT  

---

## Finding 1: WRONG ROLE — should be `alertdialog`, not `dialog`

`role="dialog"` is used on line 50, but this is a confirmation prompt demanding immediate user response.

**Evidence.** MDN states: *"The `alertdialog` role is used to notify users of urgent information that demands the user's immediate attention. Examples include error messages that require confirmation and other **action confirmation prompts**."* MDN Example 2 shows a confirmation dialog with "Are you sure you want to delete this image?" using `role="alertdialog"`.

W3C WAI-ARIA APG: *"The Alert Dialog Pattern is often employed in circumstances where a dialog contains the final step in a process that is not easily reversible, such as deleting data or completing a financial transaction."*

**Impact.** Screen readers announce `dialog` with no urgency. A confirmation dialog should announce as `alertdialog` so the user understands immediate action is required. This fails WCAG 4.1.2 (Name, Role, Value).

**Fix.** Replace `role="dialog"` with `role="alertdialog"`.

---

## Finding 2: `aria-labelledby` points to `<p>` message — no title/heading exists

`aria-labelledby="confirm-msg"` references the `<p>` paragraph (line 52). According to W3C/MDN, `aria-labelledby` should link to the **title** of the dialog, not its body text.

**Evidence.** MDN: *"The `aria-labelledby` attribute is generally the id of the element used to **title** the alertdialog."* The W3C APG alertdialog example uses an `<h2 id="dialog_label">Confirmation</h2>` as the labelledby target.

The current component has **no heading/title element**, so screen readers treat the message body as both the name and the description, which conflates the two. This is a structural ARIA violation.

**Impact.** Screen reader announces the raw message as the dialog's name with no title context. Users cannot distinguish between "what this dialog is called" vs. "what this dialog says."

**Fix.** Add an `<h2>` (visually hidden or visible) with `id="confirm-title"` and point `aria-labelledby` to it. Move `aria-labelledby="confirm-msg"` to `aria-describedby="confirm-msg"`.

---

## Finding 3: `aria-describedby` is MISSING entirely

There is **no** `aria-describedby` attribute. The `<p>` message provides the descriptive content but is used as the label instead.

**Evidence.** MDN: *"The alert dialog text must have an accessible description using `aria-describedby`."* The W3C APG Alert Dialog Example:

```html
<div role="alertdialog" aria-modal="true"
     aria-labelledby="dialog_label"
     aria-describedby="dialog_desc">
  <h2 id="dialog_label">Confirmation</h2>
  <div id="dialog_desc">
    <p>Are you sure you want to delete this image?</p>
  </div>
</div>
```

**Impact.** Screen readers only announce the label (the `<p>` text). They do not separately announce a description. The dialog structure is flattened to a single announcement without hierarchical "title → description" reading.

**Fix.** Add `aria-describedby="confirm-msg"` to the outer `<div>` and change `aria-labelledby` to point to a proper title element.

---

## Finding 4: Stale `buttons` NodeList — dynamic content breaks the trap

The `buttons` NodeList is queried once on mount (line 13) but the `handleKeyDown` function (lines 16–37) closes over that stale reference. If buttons change dynamically (e.g., conditional rendering, async loading), new buttons are invisible to the trap.

**Evidence.** The W3C APG Dialog Pattern JavaScript queries focusable elements **live** on every keydown event:

```javascript
function handleKeyDown(event) {
  // ...
  var focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  var first = focusableElements[0];
  var last = focusableElements[focusableElements.length - 1];
  // trap logic
}
```

The code at `src/shared/ui/Confirm.jsx:23` uses the static `buttons` variable captured at effect time. If `buttons.length` was 2 on mount but becomes 3 later, the tab trap still cycles between the original 2 elements.

**Impact.** Keyboard users can tab to elements outside the dialog if new elements appear, breaking WCAG 2.1.2 (No Keyboard Trap).

**Fix.** Move `querySelectorAll('button')` inside `handleKeyDown` to query live every time Tab is pressed.

---

## Finding 5: `onOk` is a stale closure — not in dependency array

`onCancel` is in the useEffect dependency array (line 47), but `onOk` is **not**. However, `onOk` is not used inside the keydown handler — it's only used on the button's `onClick`. This is correct for the keydown handler, but reveals a design issue: if the parent passes a new `onOk` reference, the button uses the latest due to React's render cycle, but the keydown handler would only use the latest `onCancel`. This inconsistency means only `onCancel` gets the stale-closure protection.

More critically, the keydown `handleKeyDown` function (line 16) is created inside useEffect and registered as a document listener. Because `handleKeyDown` is recreated on every effect re-run (when `onCancel` changes), each new render with a different `onCancel` reference tears down and re-attaches the listener. This is correct but unnecessarily wasteful.

**Evidence.** React docs recommend `useCallback` when a function is passed as a dependency to useEffect or used as a prop to memoized children. However, here the handler is defined inside useEffect, so `useCallback` is not needed for stability — but the effect dependency on `onCancel` means the **same effect teardown/restart** happens every time `onCancel` changes reference.

**Impact.** On every render where `onCancel` changes reference (e.g., inline arrow function in parent), the effect:
1. Removes the old listener
2. Captures new `prevFocus`
3. Re-queries `buttons` (though this is fine)
4. Adds the new listener

This is a performance concern for parents that don't memoize `onCancel`.

**Fix.** Use `useRef` for `onCancel` and `onOk` to avoid the effect dependency entirely:

```javascript
var cancelRef = useRef(onCancel);
cancelRef.current = onCancel;
```

Then reference `cancelRef.current` inside the effect with an empty dependency array. This prevents unnecessary effect re-runs.

---

## Finding 6: No `inert` on background — manual tab trap is incomplete

The current implementation only intercepts Tab and Shift+Tab via `document.addEventListener('keydown', ...)`. It does NOT:
- Prevent mouse clicks on background elements (only the CSS overlay blocks visual clicks)
- Remove background elements from the screen reader's accessibility tree
- Prevent programmatic `.focus()` calls on background elements

`aria-modal="true"` (line 50) signals to assistive technologies that content outside is inert, but the browser does not enforce this — only screen readers that support `aria-modal` will honor it.

**Evidence.** MDN on `inert`: *"After `inert`, any parts of the document can be 'frozen' insomuch that they are no longer focus targets or are interactive with a mouse. Instead of trapping focus, focus is guided into the only interactive part of the document."*

web.dev: *"Applying the `aria-modal` property... replaces the technique of using `aria-hidden` on the background for informing assistive technologies that content outside a dialog is inert."*

Not all screen readers support `aria-modal` equally. The combination of `aria-modal="true"` + `inert` on siblings is the robust approach.

**Impact.** Older screen readers may allow users to navigate outside the dialog (WCAG 2.4.3 Focus Order failure). Users with screen readers that don't support `aria-modal` can interact with background content.

**Fix.** Add `inert` to sibling elements (or `<body>` children except the dialog) when the dialog is open. A React approach:

```javascript
useEffect(function () {
  var root = document.getElementById('root');
  if (root) root.setAttribute('inert', '');
  return function () { root?.removeAttribute('inert'); };
}, []);
```

---

## Finding 7: No `aria-hidden` on sibling elements for legacy screen reader support

`aria-modal="true"` theoretically handles hiding background content from the accessibility tree. However, the MDN documentation notes that `aria-modal` is a **relatively new property** and support is varying. The W3C APG states:

*"In legacy dialog implementations where `aria-hidden` is used to make content outside a dialog inert for assistive technology users, it is important that `aria-hidden` is set to `true` on each element containing a portion of the inert layer."*

**Impact.** Screen readers that do not support `aria-modal` will still announce and navigate background content while the dialog is open.

**Fix.** Apply `aria-hidden="true"` to wrapper elements outside the dialog as a fallback for legacy AT, in addition to `inert`.

---

## Summary Table

| # | Finding | Severity | Lines | Fix |
|---|---------|----------|-------|-----|
| 1 | Wrong role — should be `alertdialog` | High | 50 | `s/role="dialog"/role="alertdialog"/` |
| 2 | `aria-labelledby` points to `<p>`, no heading | High | 50, 52 | Add `<h2>` title, relabel via `aria-labelledby` |
| 3 | `aria-describedby` missing | High | 50 | Add `aria-describedby="confirm-msg"` |
| 4 | Stale `buttons` NodeList breaks dynamic content | Medium | 13, 23 | Move `querySelectorAll` inside `handleKeyDown` |
| 5 | `onCancel` in deps causes unnecessary effect re-run | Low | 47 | Use `useRef` for callbacks, empty deps |
| 6 | No `inert` on background — manual trap incomplete | Medium | — | Add `inert` to `<body>` children |
| 7 | No `aria-hidden` fallback for legacy AT | Low | — | Add `aria-hidden="true"` to wrappers |

---

## References

1. MDN — ARIA `alertdialog` role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alertdialog_role
2. W3C WAI-ARIA APG — Alert Dialog Example: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/
3. W3C WAI-ARIA APG — Dialog (Modal) Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
4. MDN — `aria-modal`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-modal
5. MDN — `inert` global attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert
6. web.dev — The `inert` attribute: https://web.dev/articles/inert
7. MDN — `dialog` role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role
8. Harvard DAS — Accessible modal dialogs: https://accessibility.huit.harvard.edu/technique-accessible-modal-dialogs
9. web.dev — Building a dialog component: https://web.dev/articles/building/a-dialog-component
