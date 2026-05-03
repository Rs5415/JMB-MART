import { useState, useRef, useEffect } from "react";
import { Search, ChevronRight, Home, LayoutGrid, Clock, Percent } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORY_DATA, SidebarCategory, CategoryGroup } from "@/src/data/categories";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoriesPageProps {
  onCategorySelect: (category: string) => void;
}

export function CategoriesPage({ onCategorySelect }: CategoriesPageProps) {
  const [selectedSidebarId, setSelectedSidebarId] = useState(CATEGORY_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedSidebar = CATEGORY_DATA.find(cat => cat.id === selectedSidebarId) || CATEGORY_DATA[0];

  const filteredGroups = selectedSidebar.groups.map(group => ({
    ...group,
    subCategories: group.subCategories.filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.subCategories.length > 0);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[80vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
      {/* Search Header */}
      <div className="p-4 md:p-6 border-b border-gray-50 bg-white sticky top-0 z-10 flex items-center gap-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">All Categories</h1>
        <div className="flex-1 relative">
          <Input 
            placeholder="Search categories..." 
            className="rounded-2xl pl-10 border-gray-100 bg-gray-50 focus:bg-white h-12 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-20 md:w-28 border-r border-gray-50 bg-gray-50/30 flex flex-col items-center py-4 gap-4 overflow-y-auto no-scrollbar">
          {CATEGORY_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedSidebarId(cat.id)}
              className={`flex flex-col items-center gap-2 w-full px-2 py-3 transition-all relative ${
                selectedSidebarId === cat.id ? 'text-red-700' : 'text-gray-400'
              }`}
            >
              {selectedSidebarId === cat.id && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-full"
                />
              )}
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-all ${
                selectedSidebarId === cat.id ? 'bg-white shadow-lg shadow-red-100' : 'bg-transparent'
              }`}>
                <span className={selectedSidebarId === cat.id ? '' : 'grayscale opacity-50'}>{cat.icon}</span>
              </div>
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center ${
                selectedSidebarId === cat.id ? 'text-red-700' : 'text-gray-500'
              }`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-4 md:p-8 bg-white">
          <div className="space-y-12">
            {filteredGroups.map((group) => (
              <div key={group.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase font-sans">{group.name}</h2>
                    {group.tagline && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.tagline}</p>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.subCategories.map((sub) => (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={sub.name}
                      onClick={() => onCategorySelect(sub.name)}
                      className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gray-50/50 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-100 group"
                    >
                      <div className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm group-hover:shadow-md transition-all relative overflow-hidden">
                        {sub.image ? (
                          <img 
                            src={sub.image} 
                            alt={sub.name} 
                            className="w-full h-full object-contain p-2 relative z-10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="relative z-10">{sub.icon}</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[10px] md:text-[11px] font-bold text-gray-900 leading-tight text-center truncate w-full px-1">
                        {sub.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <p className="font-black text-gray-900 tracking-tight">No categories found</p>
                <p className="text-xs text-gray-400 font-bold mt-1">Try a different search term</p>
              </div>
            )}
          </div>
          <div className="h-20" /> {/* Spacer for scrolling */}
        </ScrollArea>
      </div>
    </div>
  );
}
