import os
import time
import httpx
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wvvrnevduupsundjxpxt.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY is missing from environment (.env).")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Curated catalog seed list across Fantasy, Sci-Fi, Romance, Thriller, Non-Fiction & Classics
SEED_TITLES = [
    # Fantasy & Sci-Fi
    "The Hobbit",
    "Dune",
    "Project Hail Mary",
    "The Song of Achilles",
    "The Name of the Wind",
    "A Court of Thorns and Roses",
    "The Way of Kings",
    "Fourth Wing",
    "Ender's Game",
    "The Three-Body Problem",
    "Harry Potter and the Sorcerer's Stone",
    "The Fellowship of the Ring",
    "Neuromancer",

    # Romance & Contemporary Fiction
    "It Ends with Us",
    "The Seven Husbands of Evelyn Hugo",
    "Normal People",
    "Red, White & Royal Blue",
    "Book Lovers",
    "The Midnight Library",
    "Lessons in Chemistry",
    "Beach Read",
    "The Love Hypothesis",

    # Mystery & Thriller
    "The Silent Patient",
    "Gone Girl",
    "The Girl with the Dragon Tattoo",
    "The Da Vinci Code",
    "Verity",
    "The Guest List",
    "A Good Girl's Guide to Murder",
    "Shutter Island",
    "And Then There Were None",

    # Non-Fiction & Self Improvement
    "Atomic Habits",
    "Sapiens: A Brief History of Humankind",
    "Thinking, Fast and Slow",
    "Educated",
    "Becoming",
    "Man's Search for Meaning",
    "Outliers",
    "Deep Work",
    "Shoe Dog",

    # Classics & Literary Fiction
    "The Alchemist",
    "1984",
    "To Kill a Mockingbird",
    "The Great Gatsby",
    "Fahrenheit 451",
    "Brave New World",
    "Crime and Punishment",
    "Lord of the Flies"
]


def simplify_genre(categories: list) -> str:
    """Tidy Google Books raw category strings into clean high-level genres."""
    if not categories:
        return "Fiction"
    cat_str = " ".join(categories).lower()
    
    if "fantasy" in cat_str or "magic" in cat_str:
        return "Fantasy"
    elif "science fiction" in cat_str or "sci-fi" in cat_str or "space" in cat_str:
        return "Sci-Fi"
    elif "romance" in cat_str or "love" in cat_str:
        return "Romance"
    elif "thriller" in cat_str or "mystery" in cat_str or "suspense" in cat_str or "crime" in cat_str:
        return "Thriller"
    elif "history" in cat_str or "biography" in cat_str or "business" in cat_str or "psychology" in cat_str or "self-help" in cat_str or "non-fiction" in cat_str:
        return "Non-Fiction"
    elif "classic" in cat_str or "literary" in cat_str:
        return "Classics"
    else:
        return categories[0].split("/")[0].strip()


def fetch_book_open_library(title_query: str):
    """Fallback search using Open Library API when Google Books is rate-limited."""
    try:
        url = "https://openlibrary.org/search.json"
        params = {"title": title_query, "limit": 1}
        headers = {"User-Agent": "NovellaBookApp/1.0"}
        r = httpx.get(url, params=params, headers=headers, timeout=15.0)
        if r.status_code != 200:
            return None
        
        docs = r.json().get("docs", [])
        if not docs:
            return None
        
        doc = docs[0]
        cover_i = doc.get("cover_i")
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg" if cover_i else None
        
        authors = doc.get("author_name", ["Unknown Author"])
        author_str = ", ".join(authors[:2])
        page_count = doc.get("number_of_pages_median") or 300
        isbn_val = (doc.get("isbn") or [None])[0]
        
        return {
            "name": doc.get("title", title_query),
            "title": doc.get("title", title_query),
            "author": author_str,
            "genre": "Fiction",
            "tropes": [],
            "total_pages": page_count,
            "total_chapters": 20,
            "cover_url": cover_url,
            "description": None,
            "isbn": isbn_val
        }
    except Exception as e:
        print(f"  [!] Open Library fallback error for '{title_query}': {e}")
        return None


def fetch_book(title_query: str):
    """Query Google Books API (Primary) with Open Library fallback (Secondary)."""
    url = "https://www.googleapis.com/books/v1/volumes"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    params = {"q": f"intitle:{title_query}", "maxResults": 1}

    try:
        r = httpx.get(url, params=params, headers=headers, timeout=15.0, follow_redirects=True)
        if r.status_code != 200:
            # Fallback search without intitle: prefix
            r = httpx.get(url, params={"q": title_query, "maxResults": 1}, headers=headers, timeout=15.0, follow_redirects=True)
            if r.status_code != 200:
                print(f"  [!] Google Books HTTP {r.status_code} for: {title_query} -> Falling back to Open Library...")
                return fetch_book_open_library(title_query)

        items = r.json().get("items")
        if not items:
            print(f"  [-] No result on Google Books for: {title_query} -> Falling back to Open Library...")
            return fetch_book_open_library(title_query)

        info = items[0].get("volumeInfo", {})
        
        # Extract cover URL
        image_links = info.get("imageLinks", {})
        cover = (
            image_links.get("extraLarge")
            or image_links.get("large")
            or image_links.get("medium")
            or image_links.get("small")
            or image_links.get("thumbnail")
            or image_links.get("smallThumbnail")
        )
        if cover:
            cover = cover.replace("http://", "https://")
        else:
            # Try Open Library fallback for cover
            ol_fallback = fetch_book_open_library(title_query)
            if ol_fallback and ol_fallback.get("cover_url"):
                cover = ol_fallback["cover_url"]

        # Extract ISBN if available
        isbn = None
        for identifier in info.get("industryIdentifiers", []):
            if identifier.get("type") in ["ISBN_13", "ISBN_10"]:
                isbn = identifier.get("identifier")
                break

        title_name = info.get("title", title_query)
        authors_list = info.get("authors", ["Unknown Author"])
        author_str = ", ".join(authors_list)
        genre_str = simplify_genre(info.get("categories"))
        page_count = info.get("pageCount") or 300
        description = info.get("description")

        return {
            "name": title_name,
            "title": title_name,
            "author": author_str,
            "genre": genre_str,
            "tropes": [],
            "total_pages": page_count,
            "total_chapters": 20,
            "cover_url": cover,
            "description": description,
            "isbn": isbn
        }
    except Exception as e:
        print(f"  [!] Exception fetching {title_query}: {e} -> Falling back to Open Library...")
        return fetch_book_open_library(title_query)


def run():
    print("=" * 60)
    print(f"Starting starter catalog seed for {len(SEED_TITLES)} titles...")
    print("=" * 60)

    # Fetch existing titles in database to avoid duplicate entries
    existing_titles = set()
    try:
        res = supabase.table("books").select("title, name").execute()
        if res.data:
            for row in res.data:
                if row.get("title"):
                    existing_titles.add(row["title"].lower().strip())
                if row.get("name"):
                    existing_titles.add(row["name"].lower().strip())
    except Exception as e:
        print(f"Notice getting existing titles: {e}")

    added_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, title_query in enumerate(SEED_TITLES, start=1):
        if title_query.lower().strip() in existing_titles:
            print(f"[{idx}/{len(SEED_TITLES)}] Skipped (already exists): {title_query}")
            skipped_count += 1
            continue

        print(f"[{idx}/{len(SEED_TITLES)}] Fetching Google Books metadata for: {title_query}...")
        book = fetch_book(title_query)
        if not book:
            failed_count += 1
            continue

        try:
            supabase.table("books").insert(book).execute()
            print(f"  [+] Successfully inserted: '{book['title']}' by {book['author']} [{book['genre']}]")
            added_count += 1
            existing_titles.add(book["title"].lower().strip())
        except Exception as e:
            print(f"  [!] Supabase insert error on '{title_query}': {e}")
            failed_count += 1

        # Gentle throttle to avoid rate-limiting
        time.sleep(0.3)

    print("=" * 60)
    print(f"Seeding finished! Added: {added_count} | Skipped: {skipped_count} | Failed: {failed_count}")
    print("=" * 60)


if __name__ == "__main__":
    run()
