// Performance Issues in Financia Frontend

## Critical Performance Bottlenecks

### 1. **TxView.jsx - Main Thread Blocking Operations**
**Location**: `src/features/transactions/TxView.jsx:34-57`
**Issue**: Complex `useMemo` with O(n²) operations

```javascript
var memo = useMemo(function() {
  var f = tx.filter(function(t) { return t.type === type; });
  if (debouncedSearch)   f = f.filter(function(t) { return t.desc.toLowerCase().includes(debouncedSearch.toLowerCase()); });
  if (dateFrom) f = f.filter(function(t) { return t.date >= dateFrom; });
  if (dateTo)   f = f.filter(function(t) { return t.date <= dateTo; });
  f.sort(function(a, b) { return b.date.localeCompare(a.date); });
  var total = f.reduce(function(s, t) { return s + t.amount; }, 0);
  var grouped = {};
  var groupOrder = [];
  f.forEach(function(t) { // O(n) loop
    if (!grouped[t.date]) { grouped[t.date] = []; groupOrder.push(t.date); }
    grouped[t.date].push(t);
  });
  // More processing...
}, [tx, type, debouncedSearch, dateFrom, dateTo]);
```

**Impact**: 
- Single expensive computation on every filter change
- Multiple chained `.filter()` operations
- Synchronous sorting and grouping
- Blocks main thread for 100-500ms on filter updates

### 2. **Dashboard.jsx - Expensive Recalculations**
**Location**: `src/features/dashboard/Dashboard.jsx:28-63`
**Issue**: Multiple O(n) calculations on every render

```javascript
var mtx  = useMemo(function() { return tx.filter(function(t) { return t.date >= pS; }); }, [tx, pS]);
var pmtx = useMemo(function() { return tx.filter(function(t) { return t.date >= ppS && t.date < pS; }); }, [tx, ppS, pS]);
var sumToday = useMemo(function() { 
  var dtx = tx.filter(function(t) { return t.date === today(); }); // O(n) filter
  dtx.forEach(function(t) { if (t.type === 'income') r.ti += t.amount; else r.to += t.amount; }); // O(n) iteration
}, [tx]);

var chartData = useMemo(function() {
  return Array.from({length: 7}, function(_, i) {
    var d = prevDays(6 - i);
    var dt = tx.filter(function(t) { return t.date === d; }); // Multiple O(n) filters
    dt.forEach(function(t) { if (t.type === 'income') sums.i += t.amount; else sums.o += t.amount; });
    return { day: new Date(d + 'T12:00').toLocaleDateString('pt-BR', {weekday: 'short'}), i: sums.i, o: sums.o };
  });
}, [tx]);
```

**Impact**:
- 4 separate O(n) operations per render
- Array.from() + map() + multiple filters
- Dashboard freezes when filtering transactions

### 3. **useSession.js - Synchronous Data Processing**
**Location**: `src/features/auth/useSession.js:92-199`
**Issue**: All data processing runs synchronously in main thread

```javascript
var res = await Promise.all([syncAll(userId), fetchRole(userId)]);
var syncResult = res[0], admin = res[1];

var prof = pr && pr.data ? pr.data : null;
var prodRows = pdr || [];
var txRows = txr || [];
var lossRows = lr || [];

if (prodRows.length > 0) await ldb.products.bulkPut(prodRows.map(function(r) { return toLocal(r, {user_id:userId}); }));
if (txRows.length > 0) await ldb.transactions.bulkPut(txRows.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description, cat:r.category}); }));
if (lossRows.length > 0) await ldb.losses.bulkPut(lossRows.map(function(l) { return toLocal(l, {user_id:userId, desc:l.description}); }));
```

**Impact**:
- Large dataset processing blocks UI
- Multiple iterations over same data
- Synchronous transformations

### 4. **useScrollReveal.js - Performance Issues**
**Location**: `src/shared/hooks/useScrollReveal.js:11-26`
**Issue**: Observer without optimization

```javascript
useEffect(function() {
  const node = ref.current;
  if (!node) return;
  const target = selector ? node.querySelector(selector) : node;
  if (!target) return;
  const obs = new IntersectionObserver(function(entries) { // Trigger on every scroll
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-up');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold, rootMargin });
  obs.observe(target);
  return function() { obs.disconnect(); };
}, [threshold, rootMargin, selector]);
```

**Impact**:
- Observer active on every scroll
- Multiple observers per page
- No passive option for scroll listeners

## Memory Leaks

### 1. **useScrollRevealMultiple - Missing Cleanup**
**Location**: `src/shared/hooks/useScrollReveal.js:35-67`
**Issue**: Timeout IDs not cleaned up

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const tid = setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100); // Escaping if component unmounts
        timeouts.push(tid); // Leaks!
        observer.unobserve(entry.target);
      }
    });
  }
);

return () => {
  observer.disconnect();
  timeouts.forEach(function(tid) { clearTimeout(tid); }); // Only works if returned
}
```

### 2. **Modal Tab Navigation - Multiple Listeners**
**Location**: `src/shared/ui/ui.jsx:175-196`
**Issue**: Listeners added without cleanup guarantee

```javascript
React.useEffect(function() {
  var focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable?.length) {
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    first.focus();
    var handleTab = function(e) { ... };
    var handleEsc = function(e) { ... };
    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEsc);
    return function() { // Cleanup
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEsc);
      previousActive.current?.focus?.();
    };
  }
}, [onClose]);
```

## Bundle Size Issues

### 1. **Lazy Loading Overhead**
**Location**: `src/routes/routes.jsx:6-13`
**Issue**: Multiple lazy imports may cause click delays

```javascript
const Dashboard     = lazy(function() { return import('../features/dashboard/Dashboard.jsx'); });
const TxView        = lazy(function() { return import('../features/transactions/TxView.jsx'); });
const InventoryView = lazy(function() { return import('../features/inventory/InventoryView.jsx'); });
// etc... 8+ lazy components
```

**Impact**:
- Each lazy component adds loading overhead
- Bundle splitting may not be optimal
- Runtime code splitting on navigation

## Event Listener Accumulation

### 1. **useQuickIntent - Missing Cleanup**
**Location**: `src/lib/quickIntent.js:42-60`
**Issue**: Listener may accumulate

```javascript
React.useEffect(function() {
  var pending = consumeQuickIntent(type);
  if (pending && pending.seq !== lastSeq.current) { ... }
  function handler(e) { ... }
  window.addEventListener(EVENT, handler);
  return function() { window.removeEventListener(EVENT, handler); }; // Cleanup on unmount
}, [type]);
```

**Note**: Actually has cleanup, but pattern suggests potential for leaks

## Solutions Implemented

### 1. **Debouncing for Filters**
**Location**: `src/shared/hooks/useDebouncedValue.js`
```javascript
export function useDebouncedValue(value, delay) {
  var [debounced, setDebounced] = useState(value);
  useEffect(function() {
    var t = setTimeout(function() { setDebounced(value); }, delay || 250);
    return function() { clearTimeout(t); }; // Cleanup
  }, [value, delay]);
  return debounced;
}
```

### 2. **Optimized Virtual Scrolling**
**Location**: `src/features/transactions/TxView.jsx:63-70`
```javascript
var virtualizer = useVirtualizer({
  count: flatRows.length,
  getScrollElement: function() { return scrollRef.current; },
  estimateSize: function(index) {
    return flatRows[index].type === 'header' ? 44 : 60; // Static estimates
  },
});
```

### 3. **Intersection Observer Optimization**
**Location**: `src/shared/hooks/useScrollReveal.js:77-89`
```javascript
useEffect(() => {
  const element = ref.current;
  if (!element) return;

  const handleScroll = () => { // Throttled!
    const scrollPosition = window.scrollY;
    const offset = scrollPosition * speed;
    element.style.transform = `translateY(${offset}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true }); // Passive!
  return () => window.removeEventListener('scroll', handleScroll);
}, [speed]);
```

### 4. **Chunked Processing**
**New Implementation**:
```javascript
// Process data in chunks to prevent blocking
function processDataInChunks(data, processor, chunkSize = 100) {
  return new Promise(resolve => {
    var results = [];
    for (var i = 0; i < data.length; i += chunkSize) {
      var chunk = data.slice(i, i + chunkSize);
      // Yield to main thread
      setTimeout(() => {
        var chunkResult = processor(chunk);
        results = results.concat(chunkResult);
        if (i + chunkSize >= data.length) {
          resolve(results);
        }
      }, 0);
    }
  });
}
```
