import Homepage_awards_section_shortlist_item from './Homepage_awards_section_shortlist_item';

interface Homepage_awards_section_shortlist_item_wrapperProps {
  blok: {
    name: string;
    member_slug: string;
    company: string;
    _uid?: string;
  };
}

function Homepage_awards_section_shortlist_item_wrapper({ blok }: Homepage_awards_section_shortlist_item_wrapperProps) {
  return (
    <Homepage_awards_section_shortlist_item 
      shortlistItem={{ name: blok.name, member_slug: blok.member_slug, company: blok.company }} 
      index={0} 
    />
  );
}

// Server components don't need React.memo - they only render on the server
export default Homepage_awards_section_shortlist_item_wrapper;

