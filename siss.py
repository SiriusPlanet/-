# siss.py (simple.support.server)
# -*- coding: utf-8 -*-
"""
SIS.SITE v1.0 — Simple Integrated Site System  
Архитектура, born from reality — not from textbooks.

Разработано не как «правильно», а как *реально работает*.

Здесь нет фреймворков — есть понимание.  
Нет шаблонов — есть логика.  
Нет избыточности — есть необходимость.

Архитектор: Sirius 
Последний сайт — лет 30 назад (в детстве).  
Не скажу точно когда - но тогда были 386 компы. (несколько штук на институт)

Версия: 1.0 (свежая)
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import os, json, time, mimetypes, urllib.parse, logging, posixpath, signal, sys
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_ROOT)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)


class SimpleHandler(BaseHTTPRequestHandler):
    # Убран __init__ — он опасен для BaseHTTPRequestHandler!
    # Вся инициализация теперь в run()

    def translate_path(self, path):
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = posixpath.normpath(urllib.parse.unquote(path))
        words = path.split('/')
        words = filter(None, words)
        path = PROJECT_ROOT
        for word in words:
            if os.path.dirname(word) or word in (os.curdir, os.pardir):
                continue
            path = os.path.join(path, word)
        return path

    def log_message(self, format, *args):
        logging.info("%s - - [%s] %s\n" %
                    (self.client_address[0],
                     self.log_date_time_string(),
                     format % args))

    def send_error_utf8(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        error_html = f"""
        <!DOCTYPE html>
        <html>
            <head><title>Ошибка {code}</title></head>
            <body><h1>Ошибка {code}</h1><p>{message}</p></body>
        </html>
        """
        self.wfile.write(error_html.encode('utf-8'))

    def do_GET(self):
        try:
            logging.debug(f"GET {self.path}")

            # Корневой путь → index.html
            if self.path == '/':
                self.path = '/index.html'

            # HTML файлы
            if self.path.endswith('.html'):
                file_path = self.path[1:]
                full_path = os.path.join(PROJECT_ROOT, file_path)

                if not os.path.exists(full_path):
                    return self.send_error_utf8(404, "HTML файл не найден")

                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()

                with open(full_path, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
                return

            # Статика
            if self.path.startswith('/static/'):
                file_path = self.path[len('/static/'):].split('?')[0]
                full_path = os.path.join(PROJECT_ROOT, 'static', file_path)

                if not os.path.exists(full_path):
                    return self.send_error_utf8(404, "Статический файл не найден")

                self.send_response(200)
                content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
                self.send_header('Content-Type', content_type)
                self.end_headers()

                with open(full_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

            # Изображения
            if self.path.startswith('/images/'):
                return self.serve_images()

            # API
            if self.path == '/api/check-access':
                return self.handle_api_check_access()

            if self.path == '/get-news':
                return self.handle_get_news()

            # Редиректы и формы
            if self.path == '/create':
                return self.show_create_form()

            if self.path.startswith('/news/'):
                return self.handle_news_request()

            # Файлы по умолчанию
            path = self.translate_path(self.path)
            if not os.path.exists(path):
                return self.send_error_utf8(404, "Файл не найден")

            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                content_type = 'application/octet-stream'

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.end_headers()

            try:
                with open(path, 'rb') as f:
                    self.wfile.write(f.read())
            except Exception as e:
                logging.error(f"Ошибка чтения файла: {str(e)}")
                self.send_error_utf8(500, "Ошибка сервера")

        except Exception as e:
            logging.error(f"Критическая ошибка GET: {e}")
            self.send_error_utf8(500, "Внутренняя ошибка")

    def do_POST(self):
        if self.path == '/save-news':
            try:
                print("[INFO] /save-news: начали")

                # [DEBUG] Безопасный парсинг boundary
                content_type = self.headers.get('Content-Type', '')
                print(f"[INFO] Content-Type: {content_type}")

                # Пример: "multipart/form-data; boundary=----WebKitFormBoundaryX"
                boundary = None
                if 'boundary=' in content_type:
                    boundary = content_type.split('boundary=')[1].strip()
                    if boundary.startswith('"') and boundary.endswith('"'):
                        boundary = boundary[1:-1]
                if not boundary:
                    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'

                boundary_bytes = boundary.encode()

                length = int(self.headers.get('Content-Length', 0))
                raw_data = self.rfile.read(length)

                # [PARSING] Парсим multipart
                parts = raw_data.split(b'--' + boundary_bytes)
                data = {}
                files = {}

                for part in parts:
                    if b'\r\n\r\n' not in part or b'Content-Disposition' not in part:
                        continue
                    try:
                        header_end = part.index(b'\r\n\r\n')
                        header = part[:header_end].decode('utf-8', errors='ignore')
                        body = part[header_end + 4:-2]  # -2: убираем \r\n в конце

                        name = None
                        filename = None

                        for line in header.split('\r\n'):
                            if line.startswith('name='):
                                name = line.split('name="')[1].split('"')[0]
                            if line.startswith('filename='):
                                filename = line.split('filename="')[1].split('"')[0]

                        if not name:
                            continue

                        if filename:
                            files[name] = {'filename': filename, 'content': body}
                        else:
                            data[name] = body.decode('utf-8')

                    except Exception as e:
                        print(f"[WARN] Ошибка разбора части: {e}")
                        continue

                print(f"[INFO] data: {list(data.keys())}")
                print(f"[INFO] files: {list(files.keys())}")

                # Извлечение и валидация
                title = data.get('title', '').strip()
                date = data.get('date', '').strip()
                preview = data.get('preview', '').strip()
                content = data.get('content', '').strip()
                image_file = files.get('image')

                # Авто-подстановка
                if not content:
                    content = f"[Нет содержания] Опубликовано: {date or '-'}"
                if not preview:
                    preview = content[:100] + ("..." if len(content) > 100 else "")

                if not title or not content:
                    return self.send_json_response(False, 'Отсутствуют обязательные поля')

                # Сохранение
                news_id = int(time.time() * 1000)

                image_path = None
                if image_file:
                    img_name = f"{news_id}.jpg"
                    img_path = PathsHelper.get_image_path(img_name)
                    os.makedirs(os.path.dirname(img_path), exist_ok=True)

                    with open(img_path, 'wb') as f:
                        f.write(image_file['content'])
                    image_path = img_name

                news_json = {
                    "id": news_id,
                    "title": title,
                    "date": date or datetime.now().strftime('%Y-%m-%d'),
                    "preview": preview,
                    "content": content,
                    "image": image_path or "400.png"
                }

                json_path = os.path.join(PROJECT_ROOT, 'data', 'news', f"{news_id}.json")
                os.makedirs(os.path.dirname(json_path), exist_ok=True)

                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(news_json, f, ensure_ascii=False, indent=2)

                print(f"[OK] Сохранено: {json_path}")
                self.send_json_response(True, id=news_id)

            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"[ERROR] /save-news error: {e}")
                self.send_json_response(False, str(e))

        else:
            self.send_error_utf8(404, "Неизвестный POST-эндпоинт")

    def send_json_response(self, success, message=None, **kwargs):
        self.send_response(200 if success else 400)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = {"success": success, **kwargs}
        if message:
            response["message"] = message
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())

    # --- API endpoints ---
    def handle_api_check_access(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {
            "access": True,
            "user": "local-user",
            "timestamp": datetime.now().isoformat()
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_get_news(self):
        try:
            news_dir = os.path.join(PROJECT_ROOT, 'data', 'news')
            files = os.listdir(news_dir)
            news_list = []

            for file in files:
                if not file.endswith(('.json', '.txt')):
                    continue
                path = os.path.join(news_dir, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        if file.endswith('.txt'):
                            content = f.read()
                            news_list.append({
                                "title": "Новая хронозапись",
                                "date": datetime.now().strftime('%Y-%m-%d'),
                                "preview": content[:100],
                                "content": content,
                                "image": "400.png"
                            })
                        else:
                            news = json.load(f)
                            if not isinstance(news, dict) or not all(k in news for k in ["title", "date", "preview", "content", "image"]):
                                raise ValueError("Неверная структура JSON")
                            news_list.append(news)
                except Exception as e:
                    logging.error(f"Ошибка обработки {file}: {e}")

            news_list.sort(key=lambda x: x.get('id', 0), reverse=True)

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "news": news_list,
                "last_update": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }, ensure_ascii=False).encode())

        except Exception as e:
            logging.error(f"Критическая ошибка /get-news: {e}")
            self.send_error_utf8(500, "Ошибка сервера")

    def handle_news_request(self):
        try:
            filename = self.path.split('/')[-1]
            if not filename.endswith('.json'):
                return self.send_error_utf8(400, "Только JSON-файлы")

            file_path = os.path.join(PROJECT_ROOT, 'data', 'news', filename)
            if not os.path.exists(file_path):
                return self.send_error_utf8(404, "Файл не найден")

            with open(file_path, 'r', encoding='utf-8') as f:
                news = json.load(f)

            os.remove(file_path)

            image_filename = news.get('image')
            if image_filename:
                img_path = PathsHelper.get_image_path(image_filename)
                if os.path.exists(img_path):
                    os.remove(img_path)
                    logging.info(f"Удалено изображение: {img_path}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode())

        except Exception as e:
            logging.error(f"Ошибка удаления: {e}")
            self.send_error_utf8(500, f"Ошибка удаления: {e}")

    def show_create_form(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()

        form_html = """
        <h1>Создание хронозаписи</h1>
        <form action="/save-news" method="post" enctype="multipart/form-data">
            <p><label>Заголовок: <input type="text" name="title" required></label></p>
            <p><label>Дата: <input type="date" name="date"></label></p>
            <p><label>Превью: <textarea name="preview" rows="3" cols="60"></textarea></label></p>
            <p><label>Содержание: <textarea name="content" rows="10" cols="80"></textarea></label></p>
            <p><label>Изображение: <input type="file" name="image" accept="image/*"></label></p>
            <p><input type="submit" value="Опубликовать"></p>
        </form>
        <a href="/">Назад</a>
        """
        self.wfile.write(form_html.encode('utf-8'))

    def serve_images(self):
        image_path = self.path[len('/images/'):].split('?')[0]
        # Извлекаем только имя файла, даже если был путь /images/img_n/name.jpg
        filename = image_path.split('/')[-1]

        # Сначала ищем в корне images/ (для logo.png, 1.png и т.д.)
        file_path = os.path.join(PROJECT_ROOT, 'images', filename)
        
        # Если не найдено, ищем в images/img_n/ (для новостных картинок)
        if not os.path.exists(file_path):
            file_path = PathsHelper.get_image_path(filename)
        
        # Если и там нет, используем fallback (400.png)
        if not os.path.exists(file_path):
            file_path = PathsHelper.get_fallback_path()

        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'image/png'

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.end_headers()

        try:
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        except Exception as e:
            logging.error(f"Ошибка отдачи изображения: {e}")
            self.send_error_utf8(500, f"Ошибка изображения: {e}")


class PathsHelper:
    @staticmethod
    def get_image_url(filename):
        # Возвращаем путь без префикса /images/ — сервер сам найдет в img_n
        return f"/images/img_n/{filename}"

    @staticmethod
    def get_image_path(filename):
        return os.path.join(PROJECT_ROOT, 'images', 'img_n', filename)

    @staticmethod
    def get_fallback_path():
        return os.path.join(PROJECT_ROOT, 'images', 'img_n', '400.png')

    @staticmethod
    def ensure_images_dir():
        try:
            os.makedirs(os.path.dirname(PathsHelper.get_image_path('dummy.jpg')), exist_ok=True)
        except Exception as e:
            logging.error(f"Ошибка создания директории images: {e}")
            raise

    @staticmethod
    def check_images_permissions():
        try:
            path = os.path.dirname(PathsHelper.get_image_path('dummy.jpg'))
            return os.access(path, os.R_OK | os.W_OK)
        except:
            return False


# --- Запуск сервера ---
def run(server_class=HTTPServer, handler_class=SimpleHandler, port=8000):
    os.makedirs(os.path.join(PROJECT_ROOT, 'data', 'news'), exist_ok=True)
    try:
        PathsHelper.ensure_images_dir()
    except Exception as e:
        print(f"[WARN] Не удалось создать images/img_n: {e}")
    
    httpd = server_class(('', port), handler_class)
    httpd.daemon_threads = True  # 👈 это всё, что нужно

    logging.info(f"[OK] Сервер запущен на порту {port}")
    print(f'[OK] Сервер запущен на http://localhost:{port}')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOP] Остановка сервера...")
        httpd.shutdown()
        sys.exit(0)


if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        logging.error(f"Критическая ошибка запуска: {e}")
        print(f"[CRITICAL] Ошибка: {e}")
        sys.exit(1)