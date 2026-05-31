---
name: ui-css-debugging
description: >
  Debugging UI/CSS issues systematically.
  Hierarchical diagnosis, HTML/flexbox validation, responsive testing patterns.
---

# Skill: UI/CSS Debugging

## 🎯 Purpose

Provide structured, efficient diagnosis for UI/CSS bugs in web applications.
Avoid guessing—use hierarchical diagnosis to pinpoint issues quickly.

---



## 🔍 Hierarchical Diagnosis - UI Bug Diagnosis Tree

When a UI bug is reported, **diagnose in this order** (top → bottom):

### 1️⃣ **LAYOUT/FLEXBOX** (Structure & Display)
**Ask**: Is the element visible at all? Does it stack correctly?

**Checklist**:
- [ ] HTML structure correct (parent/child hierarchy)
- [ ] CSS display properties (flex, grid, block, none)
- [ ] Container widths/heights set correctly
- [ ] Flexbox properties on parent (flex, justify-content, align-items)
- [ ] Media queries for responsive (@media min-width/max-width)

**Pattern**: Read HTML **and** CSS side-by-side to verify structure matches CSS selectors.

**Example**: 
```html
<!-- BAD: .action-buttons inside ul.nav-links -->
<ul class="nav-links">
  <li>Link 1</li>
  <li>Link 2</li>
  <div class="action-buttons"><!-- ❌ Wrong parent --></div>
</ul>

<!-- GOOD: .action-buttons at same level -->
<ul class="nav-links">
  <li>Link 1</li>
  <li>Link 2</li>
</ul>
<div class="action-buttons"></div>
```

---

### 2️⃣ **VISIBILITY** (Display/Opacity/Z-Index)
**Ask**: Is it hidden? Is it behind something?

**Checklist**:
- [ ] `display: none` / `display: block` (check mobile media queries)
- [ ] `visibility: hidden` / `visibility: visible`
- [ ] `opacity: 0` / `opacity: 1`
- [ ] `overflow: hidden` on parent (cutting off children)
- [ ] `z-index` values (ensure stacking order is correct for modals, sticky headers)

**Pattern**: 
```bash
# Check element visibility in browser DevTools console:
document.querySelector('.selector').offsetParent !== null  # true = visible
getComputedStyle(el).display                               # Should NOT be 'none'
```

---

### 3️⃣ **RESPONSIVE/MOBILE** (Media Queries)
**Ask**: Does it work on desktop but not mobile (< 768px)?

**Checklist**:
- [ ] Viewport meta tag present: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Media query breakpoints align (project typically uses 768px for mobile/desktop)
- [ ] Mobile-first CSS (base styles for mobile, @media (min-width) for desktop)
- [ ] Touch targets size (minimum 44-48px for buttons on mobile)
- [ ] Hidden elements on mobile (@media max-width: visibility/display)

**Pattern**:
```css
/* ✅ Mobile-first */
.element {
  display: block;  /* Mobile */
}
@media (min-width: 768px) {
  .element {
    display: flex;  /* Desktop */
  }
}

/* ❌ Desktop-first (wrong) */
.element {
  display: flex;  /* Wrong for mobile */
}
@media (max-width: 767px) {
  .element {
    display: block;
  }
}
```

---

### 4️⃣ **JAVASCRIPT** (Event Listeners, State)
**Ask**: Is the element being hidden/shown by JS? Are event listeners attached?

**Checklist**:
- [ ] Event listeners properly attached (click, scroll, resize)
- [ ] State management (open/closed classes being toggled)
- [ ] No JavaScript errors in console (DevTools Console tab)
- [ ] CSS classes added/removed by JS match CSS selectors

**Pattern**:
```javascript
// ✅ Verify event listener is attached
console.log(element.addEventListener.toString());

// ✅ Check if class was added
element.classList.contains('open')  // true/false

// ❌ Common mistake: JS adds class "open" but CSS checks ".active"
element.classList.add('open');      // JS
.active { display: block; }         // CSS - mismatch!
```

---

## 📱 Testing UI Issues

**Important**: Automated tests cover the **backend only** (Mocha tests in `tests/`).  
**For UI/CSS testing, you MUST test manually in the browser**.

If a UI issue is reported (labels: `ui`, or path: `src/www/`):
1. **Ask the human to test** the fix in their browser at mobile breakpoint (<768px)
2. Test locally yourself if `pnpm start` is available
3. Use DevTools Device Mode to simulate mobile (Ctrl+Shift+M)

---

## 🛠️ Core Structure: Read HTML & CSS Together

**Most UI bugs stem from mismatched HTML structure vs CSS selectors.**

### Bad Example (Issue #202):
```html
<!-- ❌ BAD: .nav-actions INSIDE ul.nav-links -->
<ul class="nav-links">
  <li>Link 1</li>
  <li>Link 2</li>
  <div class="nav-actions"><!-- Problem: in wrong parent --></div>
</ul>

<!-- CSS expects .nav-actions at same level as .nav-links -->
.bes-nav {
  display: flex;
  justify-content: space-between;  /* Won't work if .nav-actions is inside ul! */
}
```

### Good Example:
```html
<!-- ✅ GOOD: .nav-actions at same level as .nav-links -->
<nav class="bes-nav">
  <div class="bes-brand">Logo</div>
  <ul class="bes-nav-links">
    <li>Link 1</li>
    <li>Link 2</li>
  </ul>
  <div class="bes-nav-actions"><!-- Correct parent level --></div>
</nav>
```

**Rule**: Always verify **HTML parent/child hierarchy matches the CSS selectors**.

---

## 🚀 Quick Debug Flow

When a UI bug is reported:

1. **Read HTML & CSS side-by-side** - Verify structure matches selectors
2. **Check flexbox/grid parents** - Is parent display flex/grid set correctly?
3. **Check media queries** - Does mobile (<768px) have different rules than desktop?
4. **Check display properties** - Is it `display: none` somewhere?
5. **Ask human to test** - UI testing requires browser (not automated)

---

## 📌 Key Takeaways

- **HTML structure drives everything** - Wrong parent/child = CSS selectors fail
- **Flexbox needs space-between** - Logo + nav-links + nav-actions must be siblings
- **Mobile breakpoint is 768px** - Test `@media (min-width: 768px)` and `@media (max-width: 767px)`
- **UI testing is manual** - Automated tests can't validate visual/responsive behavior
- **Always ask human to verify** - They see the real device/browser

---

## 🔗 Related Skills

- **llm-good-practice**: Terminal patterns, pagers, environment
- **dev-github-issue**: Full workflow for issue development (Phase 5 includes UI testing)

---

SKILL:ui-css-debugging

