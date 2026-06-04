import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

load_dotenv()

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'}
TOKEN = os.getenv('MEDIA_AGENT_TOKEN', '')
ALLOWED_ROOTS = [
    Path(root.strip()).resolve()
    for root in os.getenv('MEDIA_AGENT_ALLOWED_ROOTS', r'D:\\').split(';')
    if root.strip()
]

app = Flask(__name__)
CORS(app)


def require_token():
    if not TOKEN:
        return None

    provided = request.headers.get('x-media-agent-token', '')
    if provided != TOKEN:
        return jsonify({'error': 'Invalid media agent token'}), 401

    return None


def is_allowed(path: Path) -> bool:
    resolved = path.resolve()
    return any(resolved == root or root in resolved.parents for root in ALLOWED_ROOTS)


def resolve_folder():
    folder = request.values.get('folder', '').strip()
    if not folder:
        return None, (jsonify({'error': 'folder is required'}), 400)

    folder_path = Path(folder).resolve()
    if not is_allowed(folder_path):
        return None, (jsonify({'error': 'folder is outside allowed roots'}), 403)

    return folder_path, None


def safe_image_path(folder_path: Path, name: str):
    filename = Path(name or '').name
    file_path = (folder_path / filename).resolve()

    if folder_path.resolve() not in file_path.parents:
        return None

    if file_path.suffix.lower() not in IMAGE_EXTENSIONS:
        return None

    return file_path


@app.before_request
def authenticate():
    if request.path == '/health':
        return None

    return require_token()


@app.get('/health')
def health():
    return jsonify({
        'status': 'OK',
        'service': 'ABK Local Media Agent',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.get('/photos')
def list_photos():
    folder_path, error = resolve_folder()
    if error:
        return error

    if not folder_path.exists():
        return jsonify({'folder': str(folder_path), 'files': []})

    files = []
    for entry in folder_path.iterdir():
        if not entry.is_file() or entry.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        stat = entry.stat()
        files.append({
            'name': entry.name,
            'size': stat.st_size,
            'modifiedAt': datetime.fromtimestamp(stat.st_mtime).isoformat()
        })

    files.sort(key=lambda item: item['modifiedAt'], reverse=True)
    return jsonify({'folder': str(folder_path), 'files': files})


@app.get('/photos/file')
def get_photo_file():
    folder_path, error = resolve_folder()
    if error:
        return error

    file_path = safe_image_path(folder_path, request.args.get('name', ''))
    if not file_path or not file_path.exists():
        return jsonify({'error': 'Photo file was not found'}), 404

    return send_file(file_path)


@app.post('/photos')
def upload_photos():
    folder_path, error = resolve_folder()
    if error:
        return error

    folder_path.mkdir(parents=True, exist_ok=True)
    uploaded = []

    for file in request.files.getlist('photos'):
        original_name = Path(file.filename or 'image').name
        suffix = Path(original_name).suffix.lower()
        if suffix not in IMAGE_EXTENSIONS:
            continue

        final_name = f'{datetime.now().strftime("%Y%m%d-%H%M%S")}-{uuid4().hex[:8]}-{original_name}'
        final_path = safe_image_path(folder_path, final_name)
        if not final_path:
            continue

        file.save(final_path)
        stat = final_path.stat()
        uploaded.append({
            'name': final_path.name,
            'size': stat.st_size,
            'modifiedAt': datetime.fromtimestamp(stat.st_mtime).isoformat()
        })

    return jsonify({'folder': str(folder_path), 'files': uploaded}), 201


if __name__ == '__main__':
    host = os.getenv('MEDIA_AGENT_HOST', '127.0.0.1')
    port = int(os.getenv('MEDIA_AGENT_PORT', '5055'))
    app.run(host=host, port=port)
