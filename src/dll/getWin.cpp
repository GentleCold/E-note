#include <Windows.h>
#include <cstring>
RECT result;
POINT cursor;
bool find = false;
BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
{
    if (GetParent(hwnd) == NULL && IsWindowVisible(hwnd) && IsWindowEnabled(hwnd)) 
    {
        // EnumChildWindows(hwnd, EnumChildWindowsProc, 1);   
        GetWindowRect(hwnd, &result);
        char name[50];
        GetClassName(hwnd, name, 50);
        // filter
        if (strcmp(name, "Windows.UI.Core.CoreWindow") == 0 || strcmp(name, "Shell_TrayWnd") == 0 || strcmp(name, "ApplicationFrameWindow") == 0 || strcmp(name, "EdgeUiInputTopWndClass") == 0) return true;
        if (result.left == 0 && result.top == 0) return true;
        if (cursor.x > result.left && cursor.y > result.top && cursor.x < result.right && cursor.y < result.bottom) 
        {
            find = true;
            return false;
        }
    }
    return true;
}

extern "C" 
{
    __declspec(dllexport) void getWin(long pos[4])
    {
        GetCursorPos(&cursor);
        HWND hwnd = GetDesktopWindow();
        EnumWindows(EnumWindowsProc, NULL);
        if (!find) 
        {
            GetWindowRect(hwnd, &result);
        }
        // 矫正阴影偏差
        if (result.left == 0 && result.top == 0) {
            pos[0] = result.left;
            pos[1] = result.top;
            pos[2] = result.right;
            pos[3] = result.bottom; 
        } else {
            pos[0] = result.left + 8;
            pos[1] = result.top;
            pos[2] = result.right - 8;
            pos[3] = result.bottom - 8; 
        }
    }
}
