**FALLBACK & RESILIENCE PLAN** 

# **Bid Compliance Verification Platform** 

_What happens when a government data source is unavailable_ 

Smart India Hackathon 2026  |  Problem Statement SIH26100 

|**Field**|**Detail**|
|---|---|
|Companion Documents|Product PRD v1.0, Technical PRD v1.0, Backend Build PRD (Final)|
|Scope|Behavior of the verifcaton engine when GSTN, MCA21, EPFO, or the<br>Blacklist/CVC source cannot be reached|
|Date|August 29, 2026|



## **1. Why This Exists** 

Government APIs going down, timing out, or returning malformed data is not a hypothetical edge case — it is routine operating reality. A verification platform that has no defined behavior for this either crashes (unusable) or silently treats missing data as “compliant” (dangerous — it could wave through a fraudulent bidder). This document defines the one correct behavior in between: flag it, don't fake it. 

## **2. The Two Failure Modes We Explicitly Reject** 

|**Rejected Behavior**|**Why It's Dangerous**|
|---|---|
|Silent pass — treat an unreachable source as<br>“compliant by default”|A bidder whose GST status was never actually<br>checked could be marked Low risk purely because<br>the check silently defaulted to PASS. This defeats the<br>entre purpose of the platorm.|
|Silent crash — let one failed adapter call<br>throw and kill the whole verifcaton run|One down source (e.g., MCA21) would block Track A<br>and Track B results too, even though they don't<br>depend on it. The ofcer gets nothing instead of a<br>partal, honest result.|



## **3. What Happens Instead — Step by Step** 

1. Catch the failure at the adapter level, not the verification engine level. Each source adapter (gstnAdapter, mca21Adapter, epfoAdapter, blacklistAdapter) wraps its call in a try/catch and returns a special UNAVAILABLE state rather than letting an exception propagate upward. 

2. Write a VerificationCheck row anyway. result: 'FLAGGED', reason: "Manual Verification Required — <source name> unavailable". The gap shows up as a real row on the checklist, not a blank space the officer might miss. 

3. The other tracks keep running. A GSTN outage does not block the fuzzy blacklist check or the correlation engine — all three tracks are independent and are each wrapped separately, so a failure in one never blocks the others. 

4. Verdict aggregation treats an unavailable source as elevating risk, never lowering it. At minimum Medium — an unreachable check is never silently excluded from the risk calculation. 

5. Log it in the Audit Log. action: 'CHECK_RUN', result: 'SOURCE_UNAVAILABLE', with the source name and timestamp — so there is a permanent record that this specific check was never machine-verified, which matters if this bidder is reviewed later. 

6. Surface it clearly on the officer's dashboard — not buried in a tooltip. A visually distinct badge (e.g., gray “?” or amber “Needs Manual Check”), separate from the green PASS / red FAIL states, with the reason text shown directly on that checklist row. 

7. The officer proceeds with full information. They can still make the award decision, but the record makes clear exactly which check was never confirmed by the system — an informed, defensible decision either way, never the system pretending everything checked out. 

## **4. Adapter Pattern (Implementation Sketch)** 

Every source adapter follows the same shape so the fallback behavior is consistent and centralized — not reimplemented per check. 

async function callSourceAdapter(adapterFn, sourceName) { try { const result = await adapterFn(); return { status: 'OK', data: result }; } catch (err) { return { status: 'UNAVAILABLE', reason: `Manual Verification Required — ${sourceName} unavailable`, }; } } // Usage inside a check: const gst = await callSourceAdapter(() => gstnAdapter.verify(gstin), 'GSTN'); if (gst.status === 'UNAVAILABLE') { return { check_type: 'EXACT', module: 'GSTIN_VALIDITY', result: 'FLAGGED', reason: gst.reason, }; } // ...continue with normal exact-match logic using gst.data 

_Because every check is written against this same wrapper, the fallback behavior only has to be built once and is guaranteed to be consistent across GSTN, MCA21, EPFO, and Blacklist checks._ 

## **5. Dashboard Display Rule** 

|**Check Result**|**Badge Shown to Ofcer**|
|---|---|
|PASS|Green — check icon|
|FAIL|Red — cross icon|
|FLAGGED (fuzzy match / correlaton issue found)|Amber — warning icon, with the specifc reason|



|**Check Result**|**Badge Shown to Ofcer**|
|---|---|
|FLAGGED (source unavailable)|Gray — “?” icon, labeled “Manual Verifcaton<br>Required”, with source name and reason shown<br>inline — visually distnct from a genuine fraud<br>fag so the ofcer doesn't confuse “couldn't<br>check” with “caught something”|



## **6. Demo Moment (Optional, High-Value)** 

If time allows, this is a strong live demo beat: deliberately toggle one mock adapter off (a simple feature flag, e.g., MOCK_MCA21_DOWN=true) mid-demo and re-run verification on a bidder. The checklist should visibly degrade to a gray “Manual Verification Required” row instead of crashing or silently passing — proving the resilience behavior live rather than only describing it on a slide. 

## **7. One-Line Summary** 

When a source can't be reached, the system never guesses on the officer's behalf — it says so, keeps working everywhere it still can, and leaves a permanent record, so the human decision that follows is always an informed one. 

