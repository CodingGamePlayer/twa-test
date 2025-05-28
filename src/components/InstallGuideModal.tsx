interface InstallGuideModalProps {
  showIOSInstallGuide: boolean;
  setShowIOSInstallGuide: (show: boolean) => void;
}

export default function InstallGuideModal({ showIOSInstallGuide, setShowIOSInstallGuide }: InstallGuideModalProps) {
  if (!showIOSInstallGuide) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowIOSInstallGuide(false);
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-slideUp">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-2xl">🍎</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800 dark:text-white">iOS에서 앱 설치하기</h3>

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📤</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">1. 공유 버튼 탭</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">하단의 공유 버튼(📤)을 탭하세요</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">➕</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">2. &quot;홈 화면에 추가&quot; 선택</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">메뉴에서 &quot;홈 화면에 추가&quot;를 찾아 탭하세요</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">3. &quot;추가&quot; 버튼 탭</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">앱 이름을 확인하고 &quot;추가&quot;를 탭하세요</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowIOSInstallGuide(false)}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          확인했습니다
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">설치 후 홈 화면에서 앱을 실행할 수 있습니다</p>
      </div>
    </div>
  );
}
