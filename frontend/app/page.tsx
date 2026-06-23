import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react'

export default function LandingPage() {
  const features = [
    { icon: Clock, title: 'سريع وسهل', desc: 'أجب على الأسئلة خلال دقائق فقط' },
    { icon: CheckCircle, title: 'منظم ودقيق', desc: 'نحافظ على معلوماتك بشكل آمن ومنظم' },
    { icon: Shield, title: 'آمن وموثوق', desc: 'بياناتك محمية ولا تشارك مع أي طرف ثالث' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 
                     dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center 
                      justify-center min-h-screen text-center">
        
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center 
                        justify-center text-white text-3xl font-bold mb-8 
                        shadow-xl shadow-blue-200 dark:shadow-blue-900">
          ب
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 
                       dark:text-white mb-4 leading-tight">
          أخبرنا عن{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r 
                           from-blue-600 to-indigo-600">
            مشروعك
          </span>
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl leading-relaxed">
          من خلال محادثة بسيطة ومنظمة، سنفهم احتياجاتك ونقدم لك أفضل الحلول
          المناسبة لمشروعك.
        </p>

        <Link
          href="/chat"
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white 
                     rounded-2xl text-lg font-bold hover:bg-blue-700 
                     transition-all duration-200 shadow-lg shadow-blue-200 
                     dark:shadow-blue-900 hover:shadow-xl hover:-translate-y-0.5
                     group"
        >
          ابدأ الاستبيان الآن
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>

        <p className="text-sm text-gray-400 dark:text-gray-600 mt-4">
          يستغرق الاستبيان حوالي 5 دقائق فقط
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 
                         shadow-sm border border-gray-100 dark:border-gray-700
                         hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl 
                              flex items-center justify-center mb-4 mx-auto">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}