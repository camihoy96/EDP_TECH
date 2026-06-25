import sys

if __name__ == '__main__':
    setup_database()
    
    if '--scan-only' in sys.argv:
        run_scan()
    else:
        run_scan()
        app.run(host='0.0.0.0', port=5000)