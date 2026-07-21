import os
import json
import concurrent.futures
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
MODEL = "openai/gpt-oss-20b"
MODEL_LARGE = "openai/gpt-oss-120b"
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _generate(prompt, model=MODEL, timeout=12, json_mode=False):
    if not os.getenv("GROQ_API_KEY"):
        return None
    try:
        kwargs = {
            "model": model,
            "temperature": 0.3,
            "messages": [{"role": "user", "content": prompt}],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        future = _EXECUTOR.submit(_client.chat.completions.create, **kwargs)
        response = future.result(timeout=timeout)
        return response.choices[0].message.content.strip()
    except concurrent.futures.TimeoutError:
        print(f"[groq] {model} timed out after {timeout}s")
        return None
    except Exception as e:
        print(f"[groq] {model} error: {e}")
        return None


# ── Vaakil: fast plain-language summary on top of the structured analysis ─────

def summarize_vaakil(analysis, country_name):
    """One tight paragraph a worried reader can absorb in five seconds, ahead of the full breakdown."""
    issues = "; ".join(analysis.get("enforceability_issues", [])[:3]) or "no clear violations found"
    rights = "; ".join(analysis.get("rights", [])[:3])
    prompt = (
        f"You are Vaakil, a plain-language legal assistant for {country_name}. "
        f"A document was analyzed with this summary: {analysis.get('summary', '')}\n"
        f"Issues found with the notice: {issues}\n"
        f"Rights the reader has: {rights}\n\n"
        f"Write ONE short paragraph (2 sentences max, under 45 words) a stressed reader can "
        f"absorb instantly: what this means for them and the single most important thing to do "
        f"first. Plain English, no legal jargon, no headers."
    )
    result = _generate(prompt)
    return result or analysis.get("summary", "")


# ── Warranties: fast risk explanation ─────────────────────────────────────────

def explain_warranty_groq(item_name, days_until_expiry, purchase_price):
    if days_until_expiry < 0:
        timing = f"expired {abs(days_until_expiry)} days ago"
    else:
        timing = f"expires in {days_until_expiry} days"
    prompt = (
        f"A user's warranty for {item_name} (purchased for Rs.{purchase_price:,.0f}) {timing}.\n\n"
        f"In 2-3 sentences: what are the risks of no warranty coverage, what should they do now, "
        f"and roughly what would a replacement or out-of-warranty repair cost in India? "
        f"Be specific with rupee estimates."
    )
    result = _generate(prompt)
    return result or (
        f"Without warranty coverage, any repair for your {item_name} will be fully out-of-pocket. "
        f"Major repairs on this category of device in India typically cost Rs.8,000-35,000 depending "
        f"on the issue. Consider purchasing an extended warranty or setting aside a repair fund now."
    )


def _parse_json(text):
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned
    try:
        return json.loads(cleaned)
    except (TypeError, json.JSONDecodeError):
        return None


def detect_jurisdiction_fast(doc_text):
    """Detect country and document type locally without any API request."""
    text = (doc_text or "")[:3000].lower()
    if any(x in text for x in ['inr', 'sarfaesi', ' rbi ', 'sebi ', 'hdfc', 'icici', 'nbfc',
                                'ncdrc', 'rupee', 'lakh', 'crore', 'india', 'indian']):
        country_code, country_name = 'IN', 'India'
    elif any(x in text for x in ['ngn', 'naira', 'cbn ', 'efcc', 'fccpc', 'nigeria', 'nigerian']):
        country_code, country_name = 'NG', 'Nigeria'
    elif any(x in text for x in ['gbp', 'hmrc', 'fca ', 'acas ', 'county court', 'ofgem',
                                  'england', 'wales', 'scotland', 'uk ', 'united kingdom']):
        country_code, country_name = 'GB', 'United Kingdom'
    elif any(x in text for x in ['aud', 'vcat', 'ncat', 'qcat', 'afca', 'accc', 'centrelink',
                                  'fair work', 'australia', 'australian']):
        country_code, country_name = 'AU', 'Australia'
    elif any(x in text for x in ['cad', 'cra ', ' ltb ', ' rtb ', 'canada', 'canadian',
                                  'ontario', 'british columbia', 'alberta']):
        country_code, country_name = 'CA', 'Canada'
    elif any(x in text for x in ['fdcpa', 'cfpb', 'eeoc', ' irs ', 'osha ', 'usd',
                                  'united states', 'american', 'federal court', 'bankruptcy court']):
        country_code, country_name = 'US', 'United States'
    elif '$' in text:
        country_code, country_name = 'US', 'United States'
    else:
        country_code, country_name = 'IN', 'India'

    if any(x in text for x in ['debt', 'loan', 'recovery', 'outstanding', 'overdue', 'collection',
                                'arrears', 'repayment', 'default notice', 'demand notice']):
        doc_type = 'debt_collection'
    elif any(x in text for x in ['evict', 'vacate', 'quit notice', 'tenancy',
                                  'terminate your tenancy', 'leave the premises', 'possession']):
        doc_type = 'eviction_notice'
    elif any(x in text for x in ['summons', 'writ', 'lawsuit', 'statement of claim',
                                  'plaintiff', 'defendant', 'court order']):
        doc_type = 'court_summons'
    elif any(x in text for x in ['terminat', 'dismiss', 'retrench', 'layoff', 'redundan',
                                  'employment end', 'last working day', 'separation']):
        doc_type = 'employment_termination'
    elif any(x in text for x in ['consumer', 'refund', 'defective', 'warranty claim',
                                  'not fit for purpose', 'misleading']):
        doc_type = 'consumer_notice'
    else:
        doc_type = 'other'
    return country_code, country_name, doc_type


def _offline_legal_analysis(rule, governing_law, forum, forum_url, template, country_name, doc_type):
    severity = "high" if doc_type in ("court_summons", "eviction_notice") else "medium"
    resources = []
    if forum and forum_url:
        resources.append({
            "name": forum,
            "url": forum_url,
            "description": f"Official filing portal for people in {country_name}.",
        })
    response_window = rule.get("response_window_days", 30)
    return {
        "summary": f"This appears to be a {doc_type.replace('_', ' ')} governed by {governing_law} in {country_name}.",
        "severity": severity,
        "rights": rule.get("key_rights", ["You have the right to respond in writing."]),
        "enforceability_issues": [
            f"{item} (check the document wording against {governing_law})"
            for item in rule.get("common_violations", [])
        ],
        "action_items": [
            {"days_from_now": 1, "action": f"Review your rights under {governing_law}", "why": "Identify the protections and response deadline that apply.", "urgent": True},
            {"days_from_now": 3, "action": "Prepare a written response and preserve all correspondence", "why": "A dated paper trail protects your position.", "urgent": True},
            {"days_from_now": response_window, "action": "Escalate before the formal response window closes", "why": "Missing the deadline may reduce your options.", "urgent": False},
        ],
        "lawyer_needed": not rule.get("self_handleable", True),
        "lawyer_reason": f"Start with the response template. Escalate to {forum} if the issuer does not resolve the matter.",
        "free_resources": resources,
        "template_response": template or f"I am writing regarding your notice and assert my rights under {governing_law}. Please communicate with me in writing.",
    }


def analyze_document(doc_text, jurisdiction_data, doc_type, image_b64=None, image_mime=None):
    """Analyze text with Groq and always retain a rule-based offline path."""
    rule = jurisdiction_data.get("document_types", {}).get(doc_type, {})
    governing_law = rule.get("governing_law", "applicable national law")
    forum = rule.get("forum", "the relevant authority")
    forum_url = rule.get("forum_url", "")
    template = rule.get("template_response", "")
    country_name = jurisdiction_data.get("country_name", "Unknown")
    fallback = _offline_legal_analysis(
        rule, governing_law, forum, forum_url, template, country_name, doc_type
    )
    if not (doc_text or "").strip():
        return fallback

    rights = "\n".join(f"- {item}" for item in rule.get("key_rights", []))
    violations = "\n".join(f"- {item}" for item in rule.get("common_violations", []))
    prompt = f"""You are Vaakil, a plain-language legal aid assistant for {country_name}.
Analyze this {doc_type.replace('_', ' ')} under {governing_law}.

Known rights:
{rights}
Common violations to check:
{violations}

Document:
{doc_text[:5000]}

Return only valid JSON with these fields: summary, severity (low|medium|high), rights (array),
enforceability_issues (array quoting exact document text), action_items (array with days_from_now,
action, why, urgent), lawyer_needed (boolean), lawyer_reason, free_resources (array), and
template_response. Do not invent quotations or legal rules."""
    parsed = _parse_json(_generate(prompt, model=MODEL, timeout=15, json_mode=True))
    if isinstance(parsed, dict):
        return parsed
    # 20B failed to produce valid JSON, escalate once to the larger model before giving up
    parsed = _parse_json(_generate(prompt, model=MODEL_LARGE, timeout=25, json_mode=True))
    return parsed if isinstance(parsed, dict) else fallback


def answer_followup(question, doc_summary, chat_history, country_name, full_analysis=None):
    history = "\n".join(
        f"{'User' if msg.get('role') == 'user' else 'Assistant'}: {msg.get('content', '')}"
        for msg in chat_history[-6:]
    )
    context = json.dumps(full_analysis, ensure_ascii=False)[:3500] if full_analysis else doc_summary
    prompt = f"""You are Vaakil, helping someone in {country_name} understand one legal document.
Use only the supplied analysis context. If it does not support an answer, say that clearly and
recommend the appropriate official authority or a qualified lawyer. Never invent a citation.

Analysis context:
{context}

Conversation:
{history}
User: {question}

Answer directly in under 180 words with practical next steps."""
    return _generate(prompt) or (
        "I could not verify that from the available document analysis. Check the original notice "
        "and contact the listed authority or a qualified legal professional before acting."
    )


def explain_bill_spike(bill_name, history, spike_pct):
    history_text = ", ".join(f"{h.get('month', '')}: Rs.{h.get('amount', 0)}" for h in history[-6:])
    prompt = f"Explain in 2-3 practical sentences why a {bill_name} bill may have risen {spike_pct:.1f}%. History: {history_text}"
    return _generate(prompt) or (
        f"Your {bill_name} bill is {spike_pct:.0f}% above its recent average. Check usage, "
        "provider rate changes, and one-time charges on the latest statement."
    )


def explain_subscription(name, amount, price_history, annual_total):
    history_text = ", ".join(f"Rs.{p.get('amount', 0)} from {p.get('from', '')}" for p in price_history)
    prompt = f"Assess this subscription in 2-3 practical sentences: {name}, Rs.{amount} per month, Rs.{annual_total:.0f} annually. Price history: {history_text}"
    return _generate(prompt) or (
        f"{name} costs Rs.{amount} per month, or Rs.{annual_total:.0f} per year. "
        "Compare that annual cost with how often you use it before the next renewal."
    )


def explain_warranty(item_name, days_until_expiry, purchase_price):
    return explain_warranty_groq(item_name, days_until_expiry, purchase_price)


def explain_grocery_trend(item_name, price_history):
    history_text = ", ".join(
        f"{p.get('date', '')[:7]}: Rs.{p.get('price', 0)}" for p in price_history[-6:]
    )
    prompt = f"Describe this grocery price trend in 2 practical sentences without inventing external statistics: {item_name}: {history_text}"
    return _generate(prompt) or (
        f"The tracked price of {item_name} has increased across recent readings. "
        "Compare nearby stores and buy extra only when the unit price falls below your recent average."
    )
