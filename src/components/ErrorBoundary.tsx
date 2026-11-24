import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lỗi giao diện React bắt được bởi ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('active_tab_4');
      localStorage.removeItem('lvp_pinned_tabs_4');
      localStorage.removeItem('lvp_startup_tab_4');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Đã xảy ra sự cố hiển thị giao diện
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Hệ thống đã tự động bảo vệ dữ liệu của Thầy/Cô. Vui lòng bấm thử lại hoặc làm mới bộ nhớ đệm bên dưới.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-left font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto max-h-32 border border-slate-200 dark:border-slate-700">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <RotateCcw size={15} />
                <span>Tải lại trang</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-600"
              >
                <Trash2 size={15} />
                <span>Khôi phục giao diện chuẩn</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
