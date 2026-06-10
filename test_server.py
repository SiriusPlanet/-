from http.server import BaseHTTPRequestHandler, HTTPServer
import logging

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        logging.info(f"Получен запрос: {self.path}")
        
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Тест модального окна</title>
                <style>
                    #testModal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.7);
                        display: none;
                    }
                    
                    .modal-dialog {
                        background: white;
                        padding: 20px;
                        max-width: 800px;
                        margin: 50px auto;
                    }
                </style>
            </head>
            <body>
                <button id="openModalBtn">Открыть модальное окно</button>

                <div id="testModal" class="modal">
                    <div class="modal-dialog">
                        <h2>Тестовое модальное окно</h2>
                        <p>Это содержимое модального окна</p>
                        <button id="closeModalBtn">Закрыть</button>
                    </div>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', () => {
                        const modal = document.getElementById('testModal');
                        const openBtn = document.getElementById('openModalBtn');
                        const closeBtn = document.getElementById('closeModalBtn');

                        openBtn.addEventListener('click', () => {
                            console.log('Открываем модальное окно');
                            modal.style.display = 'block';
                        });

                        closeBtn.addEventListener('click', () => {
                            console.log('Закрываем модальное окно');
                            modal.style.display = 'none';
                        });

                        window.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape' && modal.style.display === 'block') {
                                console.log('Закрытие по Esc');
                                modal.style.display = 'none';
                            }
                        });
                    });
                </script>
            </body>
            </html>
            """
            
            self.wfile.write(html_content.encode('utf-8'))
            return

def run(server_class=HTTPServer, handler_class=TestHandler, port=8001):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Тестовый сервер запущен на http://localhost:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Сервер остановлен")
        httpd.server_close()

if __name__ == '__main__':
    run()
