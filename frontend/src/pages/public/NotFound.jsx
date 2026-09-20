import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageWrapper className="relative min-h-[80vh] flex items-center justify-center py-16 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-6">
        <Card className="p-8 bg-surface-raised/50 backdrop-blur-md border border-white/10 shadow-elevated">
          {/* Visual House/Ghost graphic representation */}
          <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto mb-6 shadow-md shadow-brand-primary/10">
            <Ghost size={40} className="animate-bounce text-brand-accent" />
          </div>

          <Badge variant="danger" className="mb-2">404 Error</Badge>
          
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary leading-tight">
            Property Not Found
          </h2>
          
          <p className="text-xs md:text-sm text-text-secondary mt-3 leading-relaxed px-2">
            The page or property address you are looking for has been removed, renamed, or is temporarily offline.
          </p>

          <div className="pt-8 grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="md"
              icon={ArrowLeft}
            >
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              size="md"
              icon={Home}
            >
              Home Feed
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
