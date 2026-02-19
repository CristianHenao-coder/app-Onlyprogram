import React from 'react';

const SafePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#fcf9f5] font-serif text-gray-800">
            {/* Header Simple */}
            <header className="py-6 px-4 border-b border-gray-200">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-emerald-800">Mindful Breath</h1>
                    <nav className="hidden md:flex gap-6 text-sm uppercase tracking-wide text-gray-500">
                        <a href="#" className="hover:text-emerald-700">Yoga</a>
                        <a href="#" className="hover:text-emerald-700">Meditation</a>
                        <a href="#" className="hover:text-emerald-700">Retreats</a>
                        <a href="#" className="hover:text-emerald-700">Shop</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center bg-emerald-50 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="relative z-10 text-center px-4">
                    <span className="block text-emerald-600 mb-4 uppercase tracking-[0.2em] text-sm">Wellness & Balance</span>
                    <h2 className="text-5xl md:text-7xl font-light mb-6 text-gray-900">Find Your Inner Peace</h2>
                    <p className="max-w-lg mx-auto text-lg text-gray-600 mb-8 leading-relaxed">
                        Join us on a journey to discover the tranquility within. Daily yoga practices, guided meditations, and a community of like-minded souls.
                    </p>
                    <button className="px-8 py-3 bg-emerald-800 text-white rounded-full hover:bg-emerald-900 transition-colors">
                        Start Your Journey
                    </button>
                </div>
            </section>

            {/* Blog Grid (Generic Content) */}
            <section className="py-16 px-4 max-w-5xl mx-auto">
                <h3 className="text-center text-3xl font-light mb-12">Latest Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((item) => (
                        <article key={item} className="group cursor-pointer">
                            <div className="h-64 bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                                <img
                                    src={`https://images.unsplash.com/photo-${item === 1 ? '1506126613408-eca07ce68773' : item === 2 ? '1552196563-55b566236b67' : '1518609878373-06d740f60d8b'}?w=800&auto=format&fit=crop`}
                                    alt="Yoga"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 uppercase">Lifestyle</span>
                            <h4 className="text-xl font-medium mt-2 group-hover:text-emerald-800 transition-colors">
                                {item === 1 ? '5 Morning Rituals for Clarity' : item === 2 ? 'The Art of Mindful Eating' : 'Meditation for Beginners'}
                            </h4>
                            <p className="text-gray-500 mt-2 text-sm line-clamp-2">
                                Discover how small changes in your daily routine can lead to a more balanced and fulfilling life. Read more...
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 text-center">
                <p className="opacity-50 text-sm">© 2024 Mindful Breath. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default SafePage;
