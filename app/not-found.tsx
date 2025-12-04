import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowRight } from 'lucide-react';
import NotFoundSearchButton from '@/components/NotFoundSearchButton';

export default function NotFound() {
  return (
    <div className="flex-1 w-full max-w-maxw mx-auto px-container min-h-screen flex items-center justify-center py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
        {/* 404 Number */}
        <div className="space-y-4">
          <h1 className="text-9xl md:text-[12rem] font-bold text-qlack leading-none">
            404
          </h1>
          <div className="w-24 h-1 bg-qreen mx-auto"></div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-qlack leading-tight">
            Page Not Found
          </h2>
          <p className="text-xl md:text-2xl text-qlack/70 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button variant="filled" size="lg" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
          </Button>
          
          <div className="hidden sm:block">
            <NotFoundSearchButton />
          </div>
          
          <Button variant="default" size="lg" asChild className="sm:hidden">
            <Link href="/search" className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search
            </Link>
          </Button>
        </div>

        {/* Popular Links */}
        <div className="pt-8 border-t border-qlack/10">
          <p className="text-lg font-semibold text-qlack mb-6">
            Popular Pages
          </p>
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Popular pages">
            <Link 
              href="/calendar" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Calendar</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
            
            <Link 
              href="/dir" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Directory</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
            
            <Link 
              href="/events" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Events</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
            
            <Link 
              href="/resources" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Resources</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
            
            <Link 
              href="/glossary" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Glossary</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
            
            <Link 
              href="/members" 
              className="flex items-center justify-between p-4 rounded-lg border-2 border-qlack/10 hover:border-qreen hover:bg-qreen/5 transition-all group"
            >
              <span className="text-lg text-qlack group-hover:text-qreen transition-colors">Members</span>
              <ArrowRight className="w-5 h-5 text-qlack/40 group-hover:text-qreen transition-colors" />
            </Link>
          </nav>
        </div>

        {/* Help Text */}
        <div className="pt-6">
          <p className="text-base text-qlack/60">
            If you believe this is an error, please{' '}
            <Link href="/search" className="text-qreen hover:underline font-medium">
              try searching
            </Link>
            {' '}or contact us for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

