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

            if self.path == '/api/login':
                return self.handle_api_login()

            if self.path == '/api/feedback':
                return self.handle_api_feedback()

            if self.path == '/api/register':
                return self.handle_api_register()

            if self.path == '/api/delete-news':
                return self.handle_api_delete_news()

            if self.path == '/api/update-news':
                return self.handle_api_update_news()

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
                            if 'name="' in line:
                                name = line.split('name="')[1].split('"')[0]
                            if 'filename="' in line:
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

                # Определяем тип лота (новость или товар)
                lot_type = data.get('lotType', 'news')  # по умолчанию - новость
                print(f"[INFO] lotType: {lot_type}")

                if lot_type == 'product':
                    # Обработка товара
                    title = data.get('title', '').strip()
                    content = data.get('content', '').strip()
                    price = data.get('price', '').strip()
                    preview = data.get('preview', '').strip() or (content[:100] + ("..." if len(content) > 100 else "") if content else "")
                    date = data.get('date', '').strip() or datetime.now().strftime('%Y-%m-%d')
                    discount = ''
                else:
                    # Обработка новости
                    title = data.get('title', '').strip()
                    date = data.get('date', '').strip()
                    preview = data.get('preview', '').strip()
                    content = data.get('content', '').strip()
                    discount = data.get('discount', '').strip()  # ← НОВОЕ: скидка

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
                    "image": image_path or "400.png",
                    "discount": int(discount) if discount and discount.isdigit() else 0,
                    "lotType": lot_type,
                    "price": price if lot_type == 'product' and price else ''
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

        elif self.path == '/api/update-news':
            return self.handle_api_update_news()
        elif self.path == '/api/delete-news':
            return self.handle_api_delete_news()
        elif self.path == '/api/register':
            return self.handle_api_register()
        else:
            self.send_error_utf8(404, "Неизвестный POST-эндпоинт")

    def do_DELETE(self):
        """Обработчик DELETE-запросов для удаления новостей"""
        if self.path == '/api/delete-news':
            return self.handle_api_delete_news()
        else:
            self.send_error_utf8(404, "Неизвестный DELETE-эндпоинт")

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
            "level": 3,
            "user": "local-user",
            "timestamp": datetime.now().isoformat()
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_api_login(self):
        """Обработка входа пользователя"""
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(length)
            data = json.loads(raw_data.decode('utf-8'))

            username = data.get('username', '').strip()
            password = data.get('password', '').strip()

            # ⚠️ ДЕМО-РЕЖИМ: пароли в открытом виде
            user_level = 0  # Гость по умолчанию

            # Проверка встроенных учётных записей
            if username == '333333' and password == '333333':
                user_level = 3  # Администратор
            elif username == '222222' and password == '222222':
                user_level = 2  # Модератор
            elif username == '111111' and password == '111111':
                user_level = 1  # Пользователь
            elif username == 'admin' and password == 'admin123':
                user_level = 3  # Администратор (старая учётка)
            elif username == 'moderator' and password == 'mod123':
                user_level = 2  # Модератор (старая учётка)
            elif username == 'user' and password == 'user123':
                user_level = 1  # Пользователь (старая учётка)
            else:
                # Проверка зарегистрированных пользователей из data/users/
                users_dir = os.path.join(PROJECT_ROOT, 'data', 'users')
                if os.path.isdir(users_dir):
                    for fname in os.listdir(users_dir):
                        if fname.endswith('.json'):
                            fpath = os.path.join(users_dir, fname)
                            try:
                                with open(fpath, 'r', encoding='utf-8') as f:
                                    user_data = json.load(f)
                                if user_data.get('username') == username and user_data.get('password') == password:
                                    user_level = user_data.get('level', 1)
                                    break
                            except:
                                continue

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            if user_level > 0:
                response = {
                    "success": True,
                    "level": user_level,
                    "message": f"Добро пожаловать, {username}!"
                }
            else:
                response = {
                    "success": False,
                    "message": "Неверное имя пользователя или пароль"
                }

            self.wfile.write(json.dumps(response, ensure_ascii=False).encode())

        except Exception as e:
            logging.error(f"Ошибка входа: {e}")
            self.send_error_utf8(500, "Ошибка сервера")

    def handle_api_feedback(self):
        """Обработка формы обратной связи"""
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(length)
            data = json.loads(raw_data.decode('utf-8'))

            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            phone = data.get('phone', '').strip()
            message = data.get('message', '').strip()

            if not name or not email or not message:
                return self.send_json_response(False, 'Заполните обязательные поля')

            # Сохраняем в data/feedback/ с timestamp
            feedback_dir = os.path.join(PROJECT_ROOT, 'data', 'feedback')
            os.makedirs(feedback_dir, exist_ok=True)

            feedback_id = int(time.time() * 1000)
            feedback_data = {
                "id": feedback_id,
                "name": name,
                "email": email,
                "phone": phone,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }

            file_path = os.path.join(feedback_dir, f"{feedback_id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(feedback_data, f, ensure_ascii=False, indent=2)

            logging.info(f"[Feedback] Сообщение от {name} ({email}) сохранено: {file_path}")
            self.send_json_response(True, 'Сообщение отправлено')

        except Exception as e:
            logging.error(f"Ошибка обработки feedback: {e}")
            self.send_json_response(False, 'Ошибка сервера')

    def handle_api_register(self):
        """Регистрация нового пользователя"""
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(length)
            data = json.loads(raw_data.decode('utf-8'))

            username = data.get('username', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()

            # Валидация
            if not username or len(username) < 3:
                return self.send_json_response(False, 'Имя пользователя должно быть не менее 3 символов')
            if not email or '@' not in email:
                return self.send_json_response(False, 'Введите корректный email')
            if not password or len(password) < 6:
                return self.send_json_response(False, 'Пароль должен быть не менее 6 символов')

            # Директория для хранения пользователей
            users_dir = os.path.join(PROJECT_ROOT, 'data', 'users')
            os.makedirs(users_dir, exist_ok=True)

            # Проверка на существующего пользователя
            for fname in os.listdir(users_dir):
                if fname.endswith('.json'):
                    fpath = os.path.join(users_dir, fname)
                    try:
                        with open(fpath, 'r', encoding='utf-8') as f:
                            existing = json.load(f)
                        if existing.get('username') == username:
                            return self.send_json_response(False, 'Пользователь с таким именем уже существует')
                        if existing.get('email') == email:
                            return self.send_json_response(False, 'Этот email уже зарегистрирован')
                    except:
                        continue

            # ⚠️ ВРЕМЕННО: пароль хранится в открытом виде (демо-режим)
            # В продакшене используйте хеширование!
            user_id = int(time.time() * 1000)
            user_data = {
                "id": user_id,
                "username": username,
                "email": email,
                "password": password,
                "level": 1,  # Новый пользователь — уровень 1
                "registered": datetime.now().isoformat()
            }

            file_path = os.path.join(users_dir, f"{user_id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(user_data, f, ensure_ascii=False, indent=2)

            logging.info(f"[Register] Новый пользователь: {username} ({email}) — уровень 1")
            self.send_json_response(True, 'Регистрация прошла успешно')

        except Exception as e:
            logging.error(f"Ошибка регистрации: {e}")
            self.send_json_response(False, 'Ошибка сервера')

    def handle_api_delete_news(self):
        """Удаление новости по ID"""
        try:
            # Получаем ID из body (POST) или query string (GET)
            length = int(self.headers.get('Content-Length', 0))
            data = {}

            if length > 0:
                raw_data = self.rfile.read(length)
                data = json.loads(raw_data.decode('utf-8'))

            news_id = data.get('id')
            
            if not news_id:
                return self.send_json_response(False, "Отсутствует ID новости")

            # Ищем файл с таким ID
            news_dir = os.path.join(PROJECT_ROOT, 'data', 'news')
            files = os.listdir(news_dir)

            json_file = None
            for file in files:
                if file.startswith(f"{news_id}.json"):
                    json_file = file
                    break

            if not json_file:
                return self.send_json_response(False, "Новость не найдена")

            # Читаем JSON перед удалением
            file_path = os.path.join(news_dir, json_file)
            with open(file_path, 'r', encoding='utf-8') as f:
                news = json.load(f)

            # Удаляем JSON файл
            os.remove(file_path)

            # Удаляем изображение, если есть
            image_filename = news.get('image')
            if image_filename:
                img_path = PathsHelper.get_image_path(image_filename)
                if os.path.exists(img_path):
                    os.remove(img_path)
                    logging.info(f"Удалено изображение: {img_path}")

            self.send_json_response(True, "Новость удалена")

        except Exception as e:
            logging.error(f"Ошибка удаления новости: {e}")
            self.send_error_utf8(500, "Ошибка сервера")

    def handle_api_update_news(self):
        """Обновление новости по ID. Поддерживает JSON (скидка) и multipart (форма редактирования)"""
        try:
            content_type = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(length)

            # Определяем формат по Content-Type
            if 'multipart/form-data' in content_type:
                # Парсим multipart (как в /save-news)
                boundary = None
                if 'boundary=' in content_type:
                    boundary = content_type.split('boundary=')[1].strip()
                    if boundary.startswith('"') and boundary.endswith('"'):
                        boundary = boundary[1:-1]
                if not boundary:
                    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'

                boundary_bytes = boundary.encode()
                parts = raw_data.split(b'--' + boundary_bytes)
                data = {}
                files = {}

                for part in parts:
                    if b'\r\n\r\n' not in part or b'Content-Disposition' not in part:
                        continue
                    try:
                        header_end = part.index(b'\r\n\r\n')
                        header = part[:header_end].decode('utf-8', errors='ignore')
                        body = part[header_end + 4:-2]

                        name = None
                        filename = None
                        for line in header.split('\r\n'):
                            if 'name="' in line:
                                name = line.split('name="')[1].split('"')[0]
                            if 'filename="' in line:
                                filename = line.split('filename="')[1].split('"')[0]

                        if not name:
                            continue
                        if filename:
                            files[name] = {'filename': filename, 'content': body}
                        else:
                            data[name] = body.decode('utf-8')
                    except Exception:
                        continue
            else:
                # JSON (например, вызов из saveDiscount)
                data = json.loads(raw_data.decode('utf-8'))
                files = {}

            news_id = data.get('id')
            if not news_id:
                return self.send_json_response(False, "Отсутствует ID новости")

            # Ищем файл
            news_dir = os.path.join(PROJECT_ROOT, 'data', 'news')
            json_file = None
            for file in os.listdir(news_dir):
                if file.startswith(f"{news_id}.json"):
                    json_file = file
                    break

            if not json_file:
                return self.send_json_response(False, "Новость не найдена")

            file_path = os.path.join(news_dir, json_file)

            with open(file_path, 'r', encoding='utf-8') as f:
                news = json.load(f)

            # Обновляем поля (из multipart или JSON)
            if 'title' in data:
                news['title'] = data['title']
            if 'date' in data:
                news['date'] = data['date']
            if 'preview' in data:
                news['preview'] = data['preview']
            if 'content' in data:
                news['content'] = data['content']
            if 'price' in data:
                news['price'] = data['price']
            if 'lotType' in data:
                news['lotType'] = data['lotType']

            # Обновляем скидку, если передана
            if 'discount' in data:
                try:
                    news['discount'] = int(data['discount'])
                except (ValueError, TypeError):
                    news['discount'] = 0

            # Если загружено новое изображение (multipart)
            image_file = files.get('image')
            if image_file and image_file['content']:
                # Удаляем старое изображение
                old_image = news.get('image')
                if old_image and old_image != '400.png':
                    old_img_path = PathsHelper.get_image_path(old_image)
                    if os.path.exists(old_img_path):
                        os.remove(old_img_path)

                # Сохраняем новое
                img_name = f"{news_id}.jpg"
                img_path = PathsHelper.get_image_path(img_name)
                os.makedirs(os.path.dirname(img_path), exist_ok=True)
                with open(img_path, 'wb') as f:
                    f.write(image_file['content'])
                news['image'] = img_name

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(news, f, ensure_ascii=False, indent=2)

            self.send_json_response(True, "Новость обновлена")

        except Exception as e:
            logging.error(f"Ошибка обновления новости: {e}")
            self.send_error_utf8(500, "Ошибка сервера")

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
                                "id": f"txt-{int(time.time() * 1000)}",
                                "title": "Новая хронозапись",
                                "date": datetime.now().strftime('%Y-%m-%d'),
                                "preview": content[:100],
                                "content": content,
                                "image": "400.png",
                                "lotType": "news",
                                "price": "",
                                "discount": 0
                            })
                        else:
                            news = json.load(f)
                            if not isinstance(news, dict) or not all(k in news for k in ["title", "date", "preview", "content", "image"]):
                                raise ValueError("Неверная структура JSON")
                            # Нормализация полей для старых записей
                            if "lotType" not in news:
                                news["lotType"] = "news"
                            if "price" not in news:
                                news["price"] = ""
                            if "discount" not in news:
                                news["discount"] = 0
                            news_list.append(news)
                except Exception as e:
                    logging.error(f"Ошибка обработки {file}: {e}")

            # Сортировка по дате (поле date, формат YYYY-MM-DD): чем новее дата — тем выше
            news_list.sort(key=lambda x: x.get('date', '1970-01-01'), reverse=True)

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
        """Обработка запросов к отдельной новости"""
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

    # --- Image serving with explicit MIME types ---
    def get_image_content_type(self, filename):
        """Возвращает MIME-тип по расширению файла"""
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.png']:
            return 'image/png'
        elif ext in ['.jpg', '.jpeg']:
            return 'image/jpeg'
        return 'image/png'  # default

    def serve_images(self):
        image_path = self.path[len('/images/'):].split('?')[0]
        # Извлекаем только имя файла, даже если был путь /images/img_n/name.jpg
        filename = image_path.split('/')[-1]

        # Ищем в images/img_n/ (основная директория для новостных картинок)
        file_path = PathsHelper.get_image_path(filename)
        
        # Если не найдено, ищем в корне images/ (для logo.png, 1.png и т.д.)
        if not os.path.exists(file_path):
            file_path = os.path.join(PROJECT_ROOT, 'images', filename)
        
        # Если и там нет, используем fallback (400.png)
        if not os.path.exists(file_path):
            file_path = PathsHelper.get_fallback_path()

        logging.debug(f"serve_images: filename={filename}, path={file_path}, exists={os.path.exists(file_path)}")

        # Явно задаем MIME-тип по расширению
        content_type = self.get_image_content_type(filename)

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
