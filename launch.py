"""
OpenClaw — Operator Console — Desktop Launcher
Starts Docker containers + Next.js server, opens native desktop window + system tray.
"""
import threading, time, sys, os, ctypes, subprocess, signal

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

PORT = 3001
URL = f"http://127.0.0.1:{PORT}"

# If running via pythonw.exe (no console), redirect output to log file
if sys.stdout is None or sys.stderr is None:
    log_path = os.path.join(BASE, "openclaw-launcher.log")
    log_file = open(log_path, "a", encoding="utf-8", buffering=1)
    sys.stdout = sys.stderr = log_file

# Tell Windows this is its own app (not python.exe) so taskbar shows our icon
APP_ID = "OpenClaw.OperatorConsole.Desktop.1"
ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_ID)

# Let pywebview use native EdgeChromium on Windows
os.environ.pop("PYWEBVIEW_GUI", None)

# Icon paths
ICO_PATH = os.path.join(BASE, "icon.ico")
PNG_PATH = os.path.join(BASE, "icon.png")

# Set Windows console title + icon
if os.path.exists(ICO_PATH):
    try:
        ctypes.windll.kernel32.SetConsoleTitleW("OpenClaw — Operator Console")
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            WM_SETICON = 0x0080
            hicon = ctypes.windll.user32.LoadImageW(0, ICO_PATH, 1, 0, 0, 0x00000010)
            if hicon:
                ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, 0, hicon)
                ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, 1, hicon)
    except Exception:
        pass

# Track the Next.js server process so we can kill it on exit
server_proc = None


def start_docker():
    """Ensure Docker containers are running."""
    print("  Starting Docker containers...")
    for container in ["openclaw-db", "openclaw-redis"]:
        try:
            result = subprocess.run(
                ["docker", "start", container],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode == 0:
                print(f"    {container} started")
            else:
                print(f"    {container}: {result.stderr.strip()}")
        except FileNotFoundError:
            print(f"    WARNING: Docker not found. Start {container} manually.")
        except subprocess.TimeoutExpired:
            print(f"    WARNING: Timeout starting {container}")


def start_server():
    """Start Next.js dev server as a subprocess."""
    global server_proc
    print(f"  Starting Next.js dev server on port {PORT}...")

    # Use npx to run next dev
    server_proc = subprocess.Popen(
        ["npx", "next", "dev", "-p", str(PORT)],
        cwd=BASE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=True,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )

    # Stream server output to our log
    def stream_output():
        if server_proc.stdout:
            for line in iter(server_proc.stdout.readline, b""):
                try:
                    print(f"  [next] {line.decode('utf-8', errors='replace').rstrip()}")
                except Exception:
                    pass
    threading.Thread(target=stream_output, daemon=True).start()


def wait_for_server(timeout=60):
    """Wait until Next.js is responding."""
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(URL, timeout=2)
            return True
        except Exception:
            time.sleep(1)
    return False


def cleanup():
    """Kill the Next.js server process on exit."""
    global server_proc
    if server_proc and server_proc.poll() is None:
        print("  Shutting down Next.js server...")
        try:
            # Kill the process tree (shell=True creates a tree)
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(server_proc.pid)],
                capture_output=True, timeout=5
            )
        except Exception:
            server_proc.kill()


# ── System tray icon ─────────────────────────────────────────────────
tray_icon = None

def start_tray():
    """Start the system tray icon in a background thread."""
    global tray_icon
    try:
        import pystray
        from PIL import Image

        if os.path.exists(ICO_PATH):
            icon_image = Image.open(ICO_PATH).copy()
        elif os.path.exists(PNG_PATH):
            icon_image = Image.open(PNG_PATH).copy()
        else:
            icon_image = Image.new("RGB", (64, 64), (0, 210, 255))

        def open_window(icon, item):
            """Reopen in browser (webview.start() can only be called once per process)."""
            import webbrowser
            webbrowser.open(URL)

        def quit_app(icon, item):
            """Fully quit the app."""
            icon.stop()
            cleanup()
            print("\n  OpenClaw — Operator Console closed.")
            sys.stdout.flush()
            os._exit(0)

        menu = pystray.Menu(
            pystray.MenuItem("Open OpenClaw", open_window, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", quit_app),
        )

        tray_icon = pystray.Icon("OpenClaw", icon_image, "OpenClaw — Operator Console — Running", menu)
        tray_icon.run()
    except ImportError:
        print("  (pystray not installed - no system tray icon)")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            cleanup()


if __name__ == "__main__":
    print("")
    print("  ================================================")
    print("   OpenClaw — Operator Console — Desktop App")
    print("  ================================================")
    print("")

    # Step 1: Start Docker containers
    start_docker()

    # Step 2: Start Next.js server
    start_server()

    # Step 3: Wait for server
    print(f"  Waiting for server at {URL} ...")
    if not wait_for_server():
        print("  ERROR: Server failed to start within 60s.")
        print("  Try running 'npx next dev -p 3001' manually.")
        cleanup()
        input("  Press Enter to exit...")
        sys.exit(1)

    print("  Server ready! Opening desktop window...")

    # Step 4: System tray (keeps app alive after window closes)
    tray_thread = threading.Thread(target=start_tray, daemon=False)
    tray_thread.start()
    print("  System tray active - app stays running when you close the window.")
    print("  Right-click tray icon to reopen or quit.")

    # Hide console window
    try:
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)  # SW_HIDE
    except Exception:
        pass

    # Step 5: Open desktop window
    try:
        import webview

        window = webview.create_window(
            title="OpenClaw — Operator Console",
            url=URL,
            width=1500,
            height=950,
            min_size=(1100, 750),
            resizable=True,
            frameless=False,
            easy_drag=False,
            text_select=True,
        )
        webview.start(debug=False)
    except (ImportError, Exception) as e:
        # Re-show console if webview fails
        try:
            hwnd = ctypes.windll.kernel32.GetConsoleWindow()
            if hwnd:
                ctypes.windll.user32.ShowWindow(hwnd, 5)  # SW_SHOW
        except Exception:
            pass
        print(f"  Desktop window unavailable ({e}). Opening in browser instead...")
        import webbrowser
        webbrowser.open(URL)

    # Window closed but tray + server keep running
    print("\n  Window closed. Server still running in background.")
    print("  Use the system tray icon to reopen or quit.")
    tray_thread.join()
