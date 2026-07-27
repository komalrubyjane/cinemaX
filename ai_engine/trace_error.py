import traceback
import sys
sys.path.insert(0, '.')

with open('error_log.txt', 'w') as f:
    try:
        from app_real import app
        f.write("app_real OK\n")
    except Exception as e:
        f.write(traceback.format_exc())
        f.write(f"\nError: {e}\n")
print("Done, check error_log.txt")
